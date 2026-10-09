import bpy
import math
import os
from mathutils import Vector

OUT_DIR = r"C:\Users\pc\Desktop\网站搭建\outputs\字遇\模型参考"
TARGETS = ["安", "喜", "乐22"]
os.makedirs(OUT_DIR, exist_ok=True)


def point_camera(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 900
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = True
scene.view_settings.look = "Medium High Contrast"

for obj in bpy.data.objects:
    obj.hide_render = True

camera_data = bpy.data.cameras.new("Codex_Product_Camera")
camera = bpy.data.objects.new("Codex_Product_Camera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.lens = 62
camera.hide_render = False

lights = []
for name, energy, size in [
    ("Codex_Key", 1200, 5.0),
    ("Codex_Fill", 700, 4.0),
    ("Codex_Rim", 900, 3.0),
]:
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.hide_render = False
    lights.append(obj)

for target_name in TARGETS:
    coll = bpy.data.collections.get(target_name)
    if not coll:
        continue
    meshes = [o for o in coll.all_objects if o.type == "MESH"]
    for obj in bpy.data.objects:
        if obj.type == "MESH":
            obj.hide_render = obj not in meshes

    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    mins = Vector([min(p[i] for p in points) for i in range(3)])
    maxs = Vector([max(p[i] for p in points) for i in range(3)])
    center = (mins + maxs) / 2
    size = maxs - mins
    frame_size = max(size.x, size.z * 0.82)
    distance = max(frame_size * 1.65, 7.0)
    camera.location = Vector((center.x, center.y - distance, center.z))
    point_camera(camera, center)

    lights[0].location = Vector((center.x - frame_size * 0.65, center.y - distance * 0.55, center.z + size.z * 0.65))
    lights[1].location = Vector((center.x + frame_size * 0.55, center.y - distance * 0.4, center.z + size.z * 0.15))
    lights[2].location = Vector((center.x + frame_size * 0.15, center.y + distance * 0.25, center.z + size.z * 0.7))
    for light in lights:
        point_camera(light, center)

    scene.render.filepath = os.path.join(OUT_DIR, f"{target_name}_模型参考.png")
    bpy.ops.render.render(write_still=True)
    print(f"WROTE_RENDER={scene.render.filepath}")
