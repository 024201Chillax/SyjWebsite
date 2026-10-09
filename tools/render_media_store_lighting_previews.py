import bpy
import math
import os
from mathutils import Vector


ROOT = r"C:\Users\pc\Desktop\网站搭建"
OUTPUT_DIR = os.path.join(
    ROOT,
    "public",
    "models",
    "media-store",
    "quality-preview",
    "lighting",
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


def smootherstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * value * (value * (value * 6.0 - 15.0) + 10.0)


def mix(a, b, amount):
    return a + (b - a) * amount


def mix_vector(a, b, amount):
    return Vector(
        (
            mix(a[0], b[0], amount),
            mix(a[1], b[1], amount),
            mix(a[2], b[2], amount),
        )
    )


def track_camera(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


scene = bpy.context.scene
camera = scene.camera

if camera is None:
    raise RuntimeError("The media-store scene does not contain an active camera.")

# Cycles is used only for offline lighting previews and shadow-catcher output.
# The website still receives a single, precomposited RGBA image per frame.
scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 24
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

scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.image_settings.compression = 28
scene.render.use_file_extension = True
scene.render.use_compositing = True
scene.render.use_sequencer = False
bpy.context.view_layer.cycles.use_pass_shadow_catcher = True

# Keep the view transform and exposure identical for all test frames.
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0.0
scene.view_settings.gamma = 1.0

# The plane is invisible in the beauty image and contributes only physically
# calculated contact shadows to the transparent RGBA result.
floor = bpy.data.objects.get("_preview_floor")
if floor is None:
    raise RuntimeError("Expected _preview_floor for the transparent shadow catcher.")
floor.hide_render = False
floor.is_shadow_catcher = True
floor.scale.x *= 4.0
floor.scale.y *= 4.0

# Cycles exposes the physically calculated shadow catcher as a multiplier pass:
# white means no shadow and darker values mean less incoming light. Convert only
# that difference into black alpha, then place it behind the transparent beauty
# render. This prevents the receiver plane itself from appearing as a gray tile.
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

# Transition-only props must never leak into the lighting test frames.
for obj in scene.objects:
    if obj.name.startswith("_transition_"):
        obj.hide_render = True
    if obj.type == "LIGHT":
        obj.data.use_shadow = True


OVERVIEW_POSITION = Vector((0.0, -22.5, 5.2))
OVERVIEW_TARGET = Vector((0.0, 0.05, 2.42))
SELECTED_POSITION = Vector((-3.15, -15.6, 4.25))
SELECTED_TARGET = Vector((-3.15, 0.05, 2.42))
RESTRICTED_POSITION = Vector((3.15, -15.8, 4.38))
RESTRICTED_TARGET = Vector((3.15, 0.05, 2.52))


def pose_for(end_position, end_target, progress):
    eased = smootherstep(progress)
    position = mix_vector(OVERVIEW_POSITION, end_position, eased)
    position.z += math.sin(progress * math.pi) * 0.14
    target = mix_vector(OVERVIEW_TARGET, end_target, eased)
    lens = mix(52.0, 56.0, eased)
    return position, target, lens


def render_pose(filename, position, target, lens):
    camera.location = position
    camera.data.lens = lens
    track_camera(camera, target)
    scene.render.filepath = os.path.join(OUTPUT_DIR, filename)
    bpy.ops.render.render(write_still=True)
    print(f"WROTE_LIGHTING_PREVIEW={scene.render.filepath}")


render_pose("01-overview.png", OVERVIEW_POSITION, OVERVIEW_TARGET, 52.0)
render_pose(
    "02-selected-mid.png",
    *pose_for(SELECTED_POSITION, SELECTED_TARGET, 0.5),
)
render_pose(
    "03-selected-close.png",
    *pose_for(SELECTED_POSITION, SELECTED_TARGET, 1.0),
)
render_pose(
    "04-restricted-mid.png",
    *pose_for(RESTRICTED_POSITION, RESTRICTED_TARGET, 0.5),
)
render_pose(
    "05-restricted-close.png",
    *pose_for(RESTRICTED_POSITION, RESTRICTED_TARGET, 1.0),
)

print(f"WROTE_LIGHTING_PREVIEWS={OUTPUT_DIR}")
