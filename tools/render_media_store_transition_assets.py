import bpy
import os
from mathutils import Vector


ROOT = r"C:\Users\pc\Desktop\网站搭建"
OUTPUT_DIR = os.path.join(ROOT, "public", "models", "media-store", "sequences", "transition")
RESOLUTION = 3072


def track_camera(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def set_hierarchy_visibility(root, visible):
    if root is None:
        return
    root.hide_render = not visible
    for child in root.children_recursive:
        child.hide_render = not visible


scene = bpy.context.scene
camera = scene.camera
if camera is None:
    raise RuntimeError("The media-store scene does not contain an active camera.")

scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = RESOLUTION
scene.render.resolution_y = RESOLUTION
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.image_settings.quality = 95
scene.render.use_compositing = False
scene.render.use_sequencer = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"

model_root = bpy.data.objects.get("media_store_root")
cover_root = bpy.data.objects.get("_transition_cover_root")
disc_root = bpy.data.objects.get("_transition_disc_root")
floor = bpy.data.objects.get("_preview_floor")
set_hierarchy_visibility(model_root, False)
if floor is not None:
    floor.hide_render = True

os.makedirs(OUTPUT_DIR, exist_ok=True)

set_hierarchy_visibility(cover_root, True)
set_hierarchy_visibility(disc_root, False)
camera.location = (15.0, -7.2, 2.0)
camera.data.lens = 70
track_camera(camera, (15.0, 0.0, 2.0))
scene.render.filepath = os.path.join(OUTPUT_DIR, "selected-cover.webp")
bpy.ops.render.render(write_still=True)
print(f"WROTE_TRANSITION={scene.render.filepath}")

set_hierarchy_visibility(cover_root, False)
set_hierarchy_visibility(disc_root, True)
camera.location = (20.0, -7.0, 2.0)
camera.data.lens = 70
track_camera(camera, (20.0, 0.0, 2.0))
scene.render.filepath = os.path.join(OUTPUT_DIR, "restricted-disc.webp")
bpy.ops.render.render(write_still=True)
print(f"WROTE_TRANSITION={scene.render.filepath}")

set_hierarchy_visibility(model_root, True)
set_hierarchy_visibility(disc_root, False)
