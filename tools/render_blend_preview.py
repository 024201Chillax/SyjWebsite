import bpy
import os

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 900
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
scene.render.filepath = r"C:\Users\pc\Desktop\网站搭建\outputs\字遇\模型校验_原场景.png"
scene.render.image_settings.color_mode = "RGBA"

os.makedirs(os.path.dirname(scene.render.filepath), exist_ok=True)
bpy.ops.render.render(write_still=True)
print(f"WROTE_RENDER={scene.render.filepath}")
