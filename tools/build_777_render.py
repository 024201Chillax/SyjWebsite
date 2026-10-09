import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ASSET = os.path.join(ROOT, 'public', 'playground', '777')
OUTPUT = os.path.join(ROOT, 'outputs')
os.makedirs(ASSET, exist_ok=True)
os.makedirs(OUTPUT, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.materials, bpy.data.curves, bpy.data.meshes, bpy.data.cameras, bpy.data.lights):
        pass


def material(name, color, metallic=0.0, roughness=0.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat


def image_material(name, path):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(path, check_existing=True)
    tex.interpolation = 'Linear'
    links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    bsdf.inputs['Roughness'].default_value = 0.34
    bsdf.inputs['Specular IOR Level'].default_value = 0.38
    if hasattr(mat, 'blend_method'):
        mat.blend_method = 'BLEND'
    return mat


def bevel(obj, amount=0.08, segments=4):
    mod = obj.modifiers.new('Soft product edge', 'BEVEL')
    mod.width = amount
    mod.segments = segments


def cylinder(name, radius, depth, mat, location=(0, 0, 0), rotation=(math.pi / 2, 0, 0), vertices=128):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def disc(name, radius, y, mat, front=True, segments=160):
    verts = [(0.0, y, 0.0)]
    uvs = [(0.5, 0.5)]
    for i in range(segments + 1):
        a = 2 * math.pi * i / segments
        x, z = radius * math.cos(a), radius * math.sin(a)
        verts.append((x, y, z))
        u = 0.5 + x / (2 * radius) if front else 0.5 - x / (2 * radius)
        uvs.append((u, 0.5 + z / (2 * radius)))
    faces = []
    for i in range(1, segments + 1):
        faces.append((0, i, i + 1) if front else (0, i + 1, i))
    mesh = bpy.data.meshes.new(name + 'Mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name='UVMap')
    for poly in mesh.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            uv_layer.data[li].uv = uvs[vi]
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def wedge(name, a0, a1, inner, outer, depth, mat, segments=12):
    verts = []
    half = depth / 2
    for y in (-half, half):
        for radius in (inner, outer):
            for i in range(segments + 1):
                a = a0 + (a1 - a0) * i / segments
                verts.append((radius * math.cos(a), y, radius * math.sin(a)))
    ring = segments + 1
    faces = []
    # front/back annular faces
    for layer in (0, 2):
        base = layer * ring
        for i in range(segments):
            if layer == 0:
                faces.append((base + i, base + i + 1, base + ring + i + 1, base + ring + i))
            else:
                faces.append((base + i, base + ring + i, base + ring + i + 1, base + i + 1))
    # radial and curved walls
    for i in range(segments):
        faces.append((i, 2 * ring + i, 2 * ring + i + 1, i + 1))
        faces.append((ring + i, ring + i + 1, 3 * ring + i + 1, 3 * ring + i))
    faces += [
        (0, ring, 3 * ring, 2 * ring),
        (segments, 2 * ring + segments, 3 * ring + segments, ring + segments),
    ]
    mesh = bpy.data.meshes.new(name + 'Mesh')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bevel(obj, 0.035, 3)
    return obj


def torus(name, major, minor, mat, location=(0, 0, 0), rotation=(math.pi / 2, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=96, minor_segments=16, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj


def track(obj, target):
    constraint = obj.constraints.new(type='TRACK_TO')
    constraint.target = target
    constraint.track_axis = 'TRACK_NEGATIVE_Z'
    constraint.up_axis = 'UP_Y'


def area(name, location, energy, size, color, target):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'DISK'
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    track(obj, target)
    return obj


clear_scene()
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = False
scene.render.image_settings.color_depth = '8'
scene.render.resolution_x = 1280
scene.render.resolution_y = 1280
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = 180
scene.view_settings.look = 'AgX - Medium High Contrast'

world = bpy.data.worlds.new('777 World')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.004, 0.004, 0.006, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.14

black = material('Carbon black rubber', (0.006, 0.006, 0.008, 1), 0.08, 0.24)
graphite = material('Graphite insert', (0.18, 0.19, 0.21, 1), 0.62, 0.26)
steel = material('Dark brushed steel', (0.12, 0.13, 0.15, 1), 0.88, 0.19)
orange = material('Signal orange', (1.0, 0.18, 0.015, 1), 0.12, 0.27)
floor_mat = material('Studio black', (0.009, 0.01, 0.014, 1), 0.0, 0.32)
front_mat = image_material('777 numeral face', os.path.join(ASSET, 'chip-front.png'))
back_mat = image_material('777 eye face', os.path.join(ASSET, 'chip-back.png'))

root = bpy.data.objects.new('777_KEYCHAIN_ROOT', None)
bpy.context.collection.objects.link(root)

body = cylinder('777 rubber chip body', 2.68, 0.42, black)
bevel(body, 0.12, 6)
body.parent = root

front = disc('777 face', 2.535, -0.221, front_mat, True)
back = disc('Eye face', 2.535, 0.221, back_mat, False)
front.parent = root
back.parent = root

for i in range(8):
    center = i * math.pi / 4 + math.pi / 8
    span = math.radians(21)
    seg = wedge(f'Graphite edge {i+1:02d}', center - span / 2, center + span / 2, 2.43, 2.71, 0.47, graphite)
    seg.parent = root

for y in (-0.19, -0.10, 0.0, 0.10, 0.19):
    ridge = torus(f'Edge ridge {y:+.2f}', 2.655, 0.026, steel, (0, y, 0))
    ridge.parent = root

# Eyelet and key ring create a recognisable keychain silhouette.
eyelet = torus('Orange eyelet', 0.30, 0.10, orange, (0, 0, 2.78))
eyelet.parent = root
connector = torus('Steel connector', 0.33, 0.085, steel, (0, 0, 3.18))
connector.parent = root
keyring = torus('Key ring', 1.17, 0.095, steel, (0, 0, 4.45))
keyring.parent = root

# A thin secondary ring catches the rim light and suggests a split key ring.
keyring2 = torus('Key ring split', 1.08, 0.035, orange, (0, -0.055, 4.45))
keyring2.parent = root

# Ground and graphic plinth.
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -3.03))
floor = bpy.context.object
floor.name = 'Infinite black floor'
floor.data.materials.append(floor_mat)

bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=4.3, depth=0.32, location=(0.5, 1.3, -2.84))
plinth = bpy.context.object
plinth.name = 'Low display plinth'
plinth.data.materials.append(floor_mat)
bevel(plinth, 0.14, 5)

# Background halo disks.
halo_mat = material('Deep red halo', (0.18, 0.001, 0.004, 1), 0.0, 0.5)
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=6.8, depth=0.12, location=(0, 3.8, 1.0), rotation=(math.pi / 2, 0, 0))
halo = bpy.context.object
halo.name = 'Red backdrop halo'
halo.data.materials.append(halo_mat)

target = bpy.data.objects.new('Camera target', None)
bpy.context.collection.objects.link(target)
target.location = (0, 0, 1.0)

camera_data = bpy.data.cameras.new('Camera')
camera = bpy.data.objects.new('Camera', camera_data)
bpy.context.collection.objects.link(camera)
scene.camera = camera
camera.data.lens = 63
camera.data.sensor_width = 36
track(camera, target)

area('Softbox warm', (-5.8, -5.2, 8.5), 1350, 5.0, (1.0, 0.71, 0.52), target)
area('Top strip', (0.4, 0.5, 10.0), 1050, 4.0, (1.0, 0.91, 0.80), target)
area('Red rim', (5.8, 2.4, 4.0), 1600, 3.2, (1.0, 0.025, 0.012), target)
area('Cool fill', (-4.0, 3.8, 1.4), 900, 3.0, (0.17, 0.31, 1.0), target)

def render_still(filename, cam_loc, root_rot, focal=63, target_z=1.0):
    camera.location = cam_loc
    camera.data.lens = focal
    target.location.z = target_z
    root.rotation_euler = root_rot
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 1280
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(ASSET, filename)
    scene.frame_set(1)
    bpy.context.view_layer.update()
    bpy.ops.render.render(write_still=True)


render_still('render-hero.png', (7.7, -12.8, 6.4), (math.radians(-5), math.radians(8), math.radians(-13)), 66, 1.0)
render_still('render-front.png', (0.2, -14.0, 1.6), (0, 0, 0), 72, 0.9)
render_still('render-edge.png', (8.8, -10.8, 4.6), (math.radians(-4), math.radians(13), math.radians(28)), 72, 0.7)
render_still('render-back.png', (-6.6, -12.2, 5.0), (math.radians(4), math.radians(-10), math.radians(180)), 68, 1.0)

# Animation: a clean 360-degree product turntable, linear and seamless.
camera.location = (7.5, -13.8, 5.5)
camera.data.lens = 68
target.location.z = 0.95
root.rotation_euler = (math.radians(-4), math.radians(8), 0)
root.keyframe_insert(data_path='rotation_euler', frame=1, index=2)
root.rotation_euler.z = math.radians(360)
root.keyframe_insert(data_path='rotation_euler', frame=181, index=2)
if root.animation_data and root.animation_data.action:
    for fc in root.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

scene.frame_end = 180
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'
scene.render.ffmpeg.constant_rate_factor = 'HIGH'
scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
scene.render.filepath = os.path.join(ASSET, '777-turntable.mp4')

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT, '777-keychain-final.blend'))
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUTPUT, '777-keychain-final-packed.blend'))
bpy.ops.render.render(animation=True)
