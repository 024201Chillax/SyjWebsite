import bpy
import math
import os
import shutil
from mathutils import Vector


ROOT = r"C:\Users\pc\Desktop\网站搭建"
OUTPUT_ROOT = os.path.join(ROOT, "public", "models", "media-store", "sequences")
FRAME_COUNT = 60
SAMPLES = 16


def smootherstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * value * (value * (value * 6.0 - 15.0) + 10.0)


def mix(a, b, amount):
    return a + (b - a) * amount


def mix_vector(a, b, amount):
    return Vector((mix(a[0], b[0], amount), mix(a[1], b[1], amount), mix(a[2], b[2], amount)))


def track_camera(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


scene = bpy.context.scene
camera = scene.camera
if camera is None:
    raise RuntimeError("The media-store scene does not contain an active camera.")

# Offline Cycles rendering preserves real view-dependent shadows, reflections
# and fixture spill while the website only decodes lightweight RGBA WebP frames.
scene.render.engine = "CYCLES"
# OptiX keeps the higher-resolution rerender practical while preserving the
# same physically based Cycles result. Fall back to CPU on machines without it.
try:
    cycles_preferences = bpy.context.preferences.addons["cycles"].preferences
    cycles_preferences.compute_device_type = "OPTIX"
    cycles_preferences.get_devices()
    for device in cycles_preferences.devices:
        device.use = device.type == "OPTIX"
    scene.cycles.device = "GPU"
except Exception as error:
    print(f"OPTIX_UNAVAILABLE={error}")
    scene.cycles.device = "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = False
scene.cycles.seed = 23
scene.cycles.use_animated_seed = False
scene.cycles.max_bounces = 4
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 2
scene.cycles.transparent_max_bounces = 4
scene.cycles.use_caustics_reflective = False
scene.cycles.use_caustics_refractive = False
scene.render.use_persistent_data = True
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.image_settings.quality = 92
scene.render.use_file_extension = True
scene.render.use_compositing = True
scene.render.use_sequencer = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.0
scene.view_settings.gamma = 1.0
bpy.context.view_layer.cycles.use_pass_shadow_catcher = True
camera.data.sensor_fit = "HORIZONTAL"

floor = bpy.data.objects.get("_preview_floor")
if floor is None:
    raise RuntimeError("Expected _preview_floor for the transparent shadow catcher.")
floor.hide_render = False
floor.is_shadow_catcher = True
floor.scale.x *= 4.0
floor.scale.y *= 4.0

for obj in scene.objects:
    if obj.name.startswith("_transition_"):
        obj.hide_render = True
    if obj.type == "LIGHT":
        obj.data.use_shadow = True

# Convert the physically calculated shadow multiplier into transparent black
# alpha and place it behind the beauty pass. The receiver plane never appears.
scene.use_nodes = True
nodes = scene.node_tree.nodes
links = scene.node_tree.links
nodes.clear()
render_layers = nodes.new("CompositorNodeRLayers")
rgb_to_bw = nodes.new("CompositorNodeRGBToBW")
shadow_rgba = nodes.new("CompositorNodeSepRGBA")
invert_shadow = nodes.new("CompositorNodeMath")
invert_shadow.operation = "SUBTRACT"
invert_shadow.inputs[0].default_value = 1.0
invert_shadow.use_clamp = True
mask_to_receiver = nodes.new("CompositorNodeMath")
mask_to_receiver.operation = "MULTIPLY"
shadow_strength = nodes.new("CompositorNodeMath")
shadow_strength.operation = "MULTIPLY"
shadow_strength.inputs[1].default_value = 0.72
shadow_strength.use_clamp = True
edge_mask = nodes.new("CompositorNodeEllipseMask")
edge_mask.x = 0.5
edge_mask.y = 0.73
edge_mask.width = 0.94
edge_mask.height = 0.44
edge_mask.rotation = 0.0
edge_mask.mask_type = "ADD"
edge_feather = nodes.new("CompositorNodeBlur")
edge_feather.filter_type = "GAUSS"
edge_feather.use_relative = True
edge_feather.factor_x = 0.075
edge_feather.factor_y = 0.12
feather_shadow = nodes.new("CompositorNodeMath")
feather_shadow.operation = "MULTIPLY"
feather_shadow.use_clamp = True
shadow_color = nodes.new("CompositorNodeRGB")
shadow_color.outputs[0].default_value = (0.015, 0.016, 0.018, 1.0)
set_shadow_alpha = nodes.new("CompositorNodeSetAlpha")
alpha_over = nodes.new("CompositorNodeAlphaOver")
alpha_over.inputs[0].default_value = 1.0
composite = nodes.new("CompositorNodeComposite")
links.new(render_layers.outputs["Shadow Catcher"], rgb_to_bw.inputs[0])
links.new(render_layers.outputs["Shadow Catcher"], shadow_rgba.inputs[0])
links.new(rgb_to_bw.outputs[0], invert_shadow.inputs[1])
links.new(invert_shadow.outputs[0], mask_to_receiver.inputs[0])
links.new(shadow_rgba.outputs["A"], mask_to_receiver.inputs[1])
links.new(mask_to_receiver.outputs[0], shadow_strength.inputs[0])
links.new(edge_mask.outputs["Mask"], edge_feather.inputs["Image"])
links.new(shadow_strength.outputs[0], feather_shadow.inputs[0])
links.new(edge_feather.outputs["Image"], feather_shadow.inputs[1])
links.new(shadow_color.outputs[0], set_shadow_alpha.inputs[0])
links.new(feather_shadow.outputs[0], set_shadow_alpha.inputs[1])
links.new(set_shadow_alpha.outputs[0], alpha_over.inputs[1])
links.new(render_layers.outputs["Image"], alpha_over.inputs[2])
links.new(alpha_over.outputs[0], composite.inputs[0])

OVERVIEW_POSITION = Vector((0.0, -22.5, 5.2))
OVERVIEW_TARGET = Vector((0.0, 0.05, 2.42))
SELECTED_POSITION = Vector((-3.15, -15.6, 4.25))
SELECTED_TARGET = Vector((-3.15, 0.05, 2.42))
RESTRICTED_POSITION = Vector((3.15, -15.8, 4.38))
RESTRICTED_TARGET = Vector((3.15, 0.05, 2.52))


def frame_pose(end_position, end_target, progress):
    eased = smootherstep(progress)
    position = mix_vector(OVERVIEW_POSITION, end_position, eased)
    position.z += math.sin(progress * math.pi) * 0.14
    target = mix_vector(OVERVIEW_TARGET, end_target, eased)
    return position, target, mix(52.0, 56.0, eased)


def render_sequence(asset_set, name, end_position, end_target, resolution, start_index=0):
    directory = os.path.join(OUTPUT_ROOT, asset_set, name)
    os.makedirs(directory, exist_ok=True)
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    for index in range(start_index, FRAME_COUNT):
        progress = index / (FRAME_COUNT - 1)
        position, target, lens = frame_pose(end_position, end_target, progress)
        camera.location = position
        camera.data.lens = lens
        track_camera(camera, target)
        scene.render.filepath = os.path.join(directory, f"frame-{index:03d}.webp")
        bpy.ops.render.render(write_still=True)
        print(f"WROTE_FRAME={asset_set}/{name}/{index:03d}")


def duplicate_overview(asset_set):
    selected_first = os.path.join(OUTPUT_ROOT, asset_set, "selected", "frame-000.webp")
    restricted_first = os.path.join(OUTPUT_ROOT, asset_set, "restricted", "frame-000.webp")
    if os.path.exists(selected_first):
        os.makedirs(os.path.dirname(restricted_first), exist_ok=True)
        shutil.copy2(selected_first, restricted_first)


for asset_set, resolution in (("desktop", (2160, 1215)), ("mobile", (1080, 1440))):
    render_sequence(asset_set, "selected", SELECTED_POSITION, SELECTED_TARGET, resolution)
    duplicate_overview(asset_set)
    render_sequence(asset_set, "restricted", RESTRICTED_POSITION, RESTRICTED_TARGET, resolution, start_index=1)

print(f"WROTE_SEQUENCES={OUTPUT_ROOT}")
