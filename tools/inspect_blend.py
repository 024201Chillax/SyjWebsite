import bpy

print("SCENE", bpy.context.scene.name)
print("FRAME", bpy.context.scene.frame_start, bpy.context.scene.frame_end, bpy.context.scene.render.fps)
print("ENGINE", bpy.context.scene.render.engine)
print("RES", bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y, bpy.context.scene.render.resolution_percentage)
print("CAMERA", bpy.context.scene.camera.name if bpy.context.scene.camera else None)
print("OBJECTS")
for obj in bpy.data.objects:
    print(obj.name, obj.type, tuple(round(v, 3) for v in obj.dimensions), tuple(round(v, 3) for v in obj.location))
print("MATERIALS")
for mat in bpy.data.materials:
    print(mat.name, "nodes", bool(mat.use_nodes))
print("IMAGES")
for image in bpy.data.images:
    print(image.name, image.filepath, image.size[:])
