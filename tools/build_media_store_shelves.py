import bpy
import math
import os
from mathutils import Vector


ROOT = r"C:\Users\pc\Desktop\网站搭建"
OUTPUT_DIR = os.path.join(ROOT, "outputs", "media-store")
PUBLIC_DIR = os.path.join(ROOT, "public", "models", "media-store")
BLEND_PATH = os.path.join(OUTPUT_DIR, "media-store-shelves.blend")
GLB_PATH = os.path.join(PUBLIC_DIR, "media-store-shelves.glb")
QUALITY_DIR = os.path.join(PUBLIC_DIR, "quality-preview")
TRANSITION_DIR = os.path.join(PUBLIC_DIR, "sequences", "transition")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)
os.makedirs(QUALITY_DIR, exist_ok=True)
os.makedirs(TRANSITION_DIR, exist_ok=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        pass


def node_by_type(nodes, node_type):
    return next((node for node in nodes if node.type == node_type), None)


def set_socket(bsdf, names, value):
    for name in names:
        socket = bsdf.inputs.get(name)
        if socket is not None:
            socket.default_value = value
            return


def material(name, base_color, metallic=0.0, roughness=0.45, emission=None, emission_strength=0.0, alpha=1.0, texture_scale=0.0, bump_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = node_by_type(mat.node_tree.nodes, "BSDF_PRINCIPLED")
    if bsdf is None:
        bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    set_socket(bsdf, ("Metallic",), metallic)
    set_socket(bsdf, ("Roughness",), roughness)
    set_socket(bsdf, ("Coat Weight", "Clearcoat"), 0.08 if metallic < 0.2 else 0.03)
    set_socket(bsdf, ("Coat Roughness", "Clearcoat Roughness"), 0.24)
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
        else:
            mat.blend_method = "BLEND"
    if texture_scale and bump_strength:
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = texture_scale
        noise.inputs["Detail"].default_value = 2.0
        noise.inputs["Roughness"].default_value = 0.58
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.035
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def vinyl_material(name, base_color=(0.012, 0.014, 0.017)):
    mat = material(name, base_color, metallic=0.28, roughness=0.27)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = node_by_type(nodes, "BSDF_PRINCIPLED")
    tex = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "RINGS"
    wave.rings_direction = "Z"
    wave.inputs["Scale"].default_value = 58.0
    wave.inputs["Distortion"].default_value = 1.2
    wave.inputs["Detail"].default_value = 2.0
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.22
    bump.inputs["Distance"].default_value = 0.018
    links.new(tex.outputs["Generated"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], wave.inputs["Vector"])
    links.new(wave.outputs["Color"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def add_box(name, location, scale, mat, bevel=0.0, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = (scale[0] / 2, scale[1] / 2, scale[2] / 2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        modifier = obj.modifiers.new(name="edge_softness", type="BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    if parent:
        obj.parent = parent
    return obj


def add_cylinder(name, location, radius, depth, mat, rotation=(math.pi / 2, 0, 0), vertices=40, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if parent:
        obj.parent = parent
    bevel = obj.modifiers.new(name="rim_softness", type="BEVEL")
    bevel.width = 0.012
    bevel.segments = 2
    return obj


def add_text(name, body, location, size, mat, parent=None):
    bpy.ops.object.text_add(location=location, rotation=(math.pi / 2, 0, 0))
    text = bpy.context.object
    text.name = name
    text.data.body = body
    text.data.align_x = "CENTER"
    text.data.align_y = "CENTER"
    text.data.size = size
    text.data.extrude = 0.012
    text.data.bevel_depth = 0.004
    text.data.materials.append(mat)
    if parent:
        text.parent = parent
    return text


def add_empty(name, location, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.2
    if parent:
        obj.parent = parent
    return obj


def add_area_light(name, location, energy, color, size, rotation=(0, 0, 0)):
    data = bpy.data.lights.new(name=name, type="AREA")
    data.energy = energy
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size[0]
    data.size_y = size[1]
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = rotation
    return obj


def add_point_light(name, location, energy, color, radius=0.45):
    data = bpy.data.lights.new(name=name, type="POINT")
    data.energy = energy
    data.color = color
    data.shadow_soft_size = radius
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    return obj


def track_camera(camera, target):
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


clear_scene()

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1600
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = True
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.render.resolution_percentage = 100
scene.view_settings.look = "AgX - Medium High Contrast"
if hasattr(scene, "eevee") and hasattr(scene.eevee, "use_gtao"):
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 3
    scene.eevee.gtao_factor = 1.15
scene.world.color = (0.82, 0.80, 0.76)

world = scene.world
world.use_nodes = True
background = node_by_type(world.node_tree.nodes, "BACKGROUND")
if background is None:
    background = world.node_tree.nodes.new("ShaderNodeBackground")
background.inputs["Color"].default_value = (0.91, 0.895, 0.86, 1)
background.inputs["Strength"].default_value = 0.75

mat_light_frame = material("M_Shelf_Selected", (0.49, 0.50, 0.49), metallic=0.66, roughness=0.43, texture_scale=155, bump_strength=0.10)
mat_light_panel = material("M_Panel_Selected", (0.72, 0.71, 0.68), metallic=0.38, roughness=0.48, texture_scale=130, bump_strength=0.07)
mat_dark_frame = material("M_Shelf_Restricted", (0.032, 0.039, 0.046), metallic=0.70, roughness=0.39, texture_scale=165, bump_strength=0.09)
mat_dark_panel = material("M_Panel_Restricted", (0.052, 0.061, 0.069), metallic=0.52, roughness=0.44, texture_scale=120, bump_strength=0.07)
mat_black = material("M_Black", (0.012, 0.015, 0.018), metallic=0.18, roughness=0.5, texture_scale=95, bump_strength=0.04)
mat_white = material("M_Label_White", (0.88, 0.865, 0.82), metallic=0.0, roughness=0.57, texture_scale=85, bump_strength=0.05)
mat_red = material("M_Warning_Red", (0.72, 0.012, 0.018), metallic=0.05, roughness=0.4, emission=(0.42, 0.0, 0.0), emission_strength=0.28)
mat_yellow = material("M_Warning_Yellow", (0.91, 0.64, 0.018), metallic=0.0, roughness=0.48, texture_scale=75, bump_strength=0.06)
mat_clear = material("M_Clear_Case", (0.74, 0.80, 0.82), metallic=0.0, roughness=0.18, alpha=0.20)
mat_acrylic = material("M_Acrylic_Edge", (0.82, 0.9, 0.94), metallic=0.0, roughness=0.12, alpha=0.34)
mat_price = material("M_Price_Label", (0.94, 0.92, 0.82), roughness=0.62, texture_scale=100, bump_strength=0.035)
mat_ink = material("M_Print_Ink", (0.018, 0.02, 0.023), roughness=0.67)
mat_brass = material("M_Label_Brass", (0.54, 0.36, 0.08), metallic=0.62, roughness=0.3)
mat_selected_sign = material("M_Selected_Lightbox", (0.92, 0.89, 0.80), roughness=0.28, emission=(1.0, 0.88, 0.68), emission_strength=1.8)
mat_restricted_sign = material("M_Restricted_Glow", (0.78, 0.015, 0.02), metallic=0.03, roughness=0.31, emission=(1.0, 0.006, 0.008), emission_strength=4.2)
mat_beacon_glow = material("M_Beacon_Glow", (0.82, 0.008, 0.012), roughness=0.24, emission=(1.0, 0.0, 0.0), emission_strength=6.0)
mat_light_warm = material("M_Light_Warm", (1.0, 0.92, 0.76), roughness=0.2, emission=(1.0, 0.78, 0.48), emission_strength=3.2)
mat_light_cool = material("M_Light_Cool", (0.7, 0.88, 1.0), roughness=0.2, emission=(0.3, 0.67, 1.0), emission_strength=3.5)
mat_floor = material("M_Preview_Floor", (0.90, 0.89, 0.85), roughness=0.62)

cover_colors = [
    (0.70, 0.68, 0.62),
    (0.16, 0.17, 0.18),
    (0.72, 0.25, 0.18),
    (0.16, 0.27, 0.42),
    (0.82, 0.79, 0.70),
    (0.36, 0.37, 0.38),
    (0.48, 0.57, 0.62),
]
cover_mats = [material(f"M_Project_{index + 1:03d}", color, metallic=0.01, roughness=0.57, texture_scale=48 + index * 5, bump_strength=0.055) for index, color in enumerate(cover_colors)]
filler_mats = [
    material("M_Case_Stone", (0.57, 0.55, 0.50), roughness=0.5),
    material("M_Case_Charcoal", (0.08, 0.085, 0.09), roughness=0.44),
    material("M_Case_Paper", (0.82, 0.80, 0.73), roughness=0.58),
    material("M_Case_Blue", (0.18, 0.27, 0.38), roughness=0.48),
]
disc_mats = [
    material("M_Disc_Silver", (0.56, 0.58, 0.59), metallic=0.82, roughness=0.2),
    material("M_Disc_Smoke", (0.055, 0.06, 0.07), metallic=0.68, roughness=0.24),
    material("M_Disc_Amber", (0.64, 0.39, 0.08), metallic=0.58, roughness=0.22),
    material("M_Disc_Pearl", (0.74, 0.68, 0.61), metallic=0.52, roughness=0.2),
]
mat_vinyl = vinyl_material("M_Vinyl_Black")

root = add_empty("media_store_root", (0, 0, 0))
selected_root = add_empty("selected_shelf", (-3.15, 0, 0), root)
restricted_root = add_empty("restricted_shelf", (3.15, 0, 0), root)


def add_bolt(name, location, mat, parent):
    add_cylinder(name, location, 0.038, 0.018, mat, vertices=16, parent=parent)


def add_price_ticket(name, x, y, z, code, parent):
    add_box(name, (x, y, z), (0.25, 0.025, 0.105), mat_price, 0.006, parent)
    if code % 3 == 0:
        add_box(f"{name}_mark", (x + 0.065, y - 0.016, z), (0.07, 0.008, 0.04), mat_yellow, 0.002, parent)


def add_selected_case(parent, x, z, index, row, front=True):
    palette = cover_mats[index % len(cover_mats)]
    if front:
        width = 0.40 + (index % 3) * 0.018
        height = 0.60
        add_box(f"selected_case_{index:03d}", (x, -0.355, z + 0.36), (width, 0.075, height), mat_clear, 0.018, parent)
        art = add_box(f"selected_cover_art_{index:03d}", (x, -0.399, z + 0.36), (width - 0.055, 0.012, height - 0.055), palette, 0.008, parent)
        art["cover_index"] = index
        accent = (mat_red, mat_brass, mat_black, mat_white)[index % 4]
        if index % 3 == 0:
            add_box(f"selected_cover_band_{index:03d}", (x - width * 0.20, -0.409, z + 0.36), (0.055, 0.008, height - 0.10), accent, 0.003, parent)
        elif index % 3 == 1:
            add_box(f"selected_cover_band_{index:03d}", (x, -0.409, z + 0.20), (width - 0.10, 0.008, 0.07), accent, 0.003, parent)
        else:
            add_cylinder(f"selected_cover_disc_{index:03d}", (x, -0.413, z + 0.36), 0.105, 0.008, accent, vertices=32, parent=parent)
        add_text(f"selected_cover_no_{index:03d}", f"{index + 1:02d}", (x, -0.421, z + 0.56), 0.052, mat_ink, parent)
    else:
        width = 0.095 + (index % 2) * 0.018
        add_box(f"selected_spine_{index:03d}", (x, -0.365, z + 0.36), (width, 0.09, 0.62), palette, 0.012, parent)
        add_box(f"selected_spine_mark_{index:03d}", (x, -0.416, z + 0.17), (width * 0.62, 0.008, 0.055), mat_white if index % 2 else mat_red, 0.002, parent)


def add_restricted_media(parent, x, z, index, row):
    variant = index % 5
    case_mat = mat_clear if variant in (0, 1, 4) else (mat_black if variant == 2 else mat_white)
    add_box(f"restricted_case_{index:03d}", (x, -0.315, z + 0.37), (0.43, 0.06, 0.68), case_mat, 0.014, parent)
    disc_mat = mat_vinyl if variant == 2 else disc_mats[(row + index) % len(disc_mats)]
    name = "pickup_disc" if (row == 1 and index % 10 == 7) else f"restricted_disc_{index:03d}"
    add_cylinder(name, (x, -0.362, z + 0.38), 0.278, 0.035, disc_mat, vertices=64, parent=parent)
    label_mat = (mat_red, mat_black, mat_brass, mat_white)[index % 4]
    add_cylinder(f"restricted_hub_{index:03d}", (x, -0.386, z + 0.38), 0.085, 0.012, label_mat, vertices=32, parent=parent)
    if index % 3 != 1:
        tag_x = x + (0.11 if index % 2 else -0.11)
        tag_z = z + (0.25 if index % 4 else 0.49)
        add_box(f"restricted_tag_{index:03d}", (tag_x, -0.421, tag_z), (0.14, 0.028, 0.19), mat_red, 0.007, parent)
        add_text(f"restricted_tag_mark_{index:03d}", "!", (tag_x, -0.439, tag_z), 0.075, mat_black, parent)


def build_selected(root_obj):
    width, height, depth = 5.4, 4.65, 0.86
    post_x = (-2.66, -0.9, 0.9, 2.66)
    for idx, x in enumerate(post_x):
        add_box(f"selected_post_{idx + 1}", (x, 0.14, 2.13), (0.13, depth, 4.26), mat_light_frame, 0.026, root_obj)
        for hole in range(14):
            add_box(f"selected_post_slot_{idx + 1}_{hole + 1}", (x, -0.302, 0.42 + hole * 0.27), (0.038, 0.012, 0.09), mat_black, 0.006, root_obj)
    add_box("selected_header_frame", (0, 0.08, 4.34), (width + 0.10, 0.53, 0.69), mat_light_frame, 0.04, root_obj)
    add_box("selected_header", (0, -0.205, 4.34), (width - 0.12, 0.045, 0.55), mat_selected_sign, 0.026, root_obj)
    add_text("selected_header_text", "SELECTED", (0, -0.245, 4.34), 0.42, mat_black, root_obj)
    add_box("selected_back_panel", (0, 0.38, 2.22), (5.24, 0.06, 3.55), mat_light_panel, 0.015, root_obj)
    for hole_row in range(11):
        for hole_col in range(25):
            add_cylinder(f"selected_peg_{hole_row:02d}_{hole_col:02d}", (-2.40 + hole_col * 0.20, 0.34, 0.55 + hole_row * 0.30), 0.018, 0.012, mat_black, vertices=12, parent=root_obj)
    add_box("selected_base", (0, 0.13, 0.18), (5.30, 0.82, 0.30), mat_light_frame, 0.03, root_obj)
    for foot_index, x in enumerate((-2.55, -0.86, 0.86, 2.55)):
        add_cylinder(f"selected_foot_{foot_index + 1}", (x, 0.08, -0.02), 0.095, 0.12, mat_black, rotation=(0, 0, 0), vertices=24, parent=root_obj)
    row_z = (0.65, 1.50, 2.35, 3.20)
    for row, z in enumerate(row_z):
        add_box(f"selected_shelf_row_{row + 1}", (0, 0.02, z), (5.18, 0.75, 0.10), mat_light_frame, 0.02, root_obj)
        add_box(f"selected_price_rail_{row + 1}", (0, -0.39, z + 0.06), (5.10, 0.08, 0.15), mat_white, 0.012, root_obj)
        add_box(f"selected_acrylic_lip_{row + 1}", (0, -0.445, z + 0.23), (5.04, 0.028, 0.20), mat_acrylic, 0.01, root_obj)
        for bracket in (-2.48, -0.84, 0.84, 2.48):
            add_box(f"selected_bracket_{row + 1}_{bracket}", (bracket, -0.02, z - 0.09), (0.13, 0.56, 0.14), mat_light_frame, 0.014, root_obj)
    for bay in range(3):
        center_x = -1.78 + bay * 1.78
        add_box(f"selected_light_housing_{bay + 1}", (center_x, -0.22, 3.93), (1.53, 0.13, 0.15), mat_light_frame, 0.035, root_obj)
        add_box(f"selected_light_{bay + 1}", (center_x, -0.296, 3.93), (1.42, 0.035, 0.075), mat_light_warm, 0.022, root_obj)
    case_index = 0
    for row, z in enumerate(row_z):
        cursor = -2.36
        col = 0
        while cursor < 2.36:
            front = (col + row) % 4 != 3
            width = 0.43 if front else 0.13
            x = cursor + width * 0.5
            add_selected_case(root_obj, x, z, case_index, row, front)
            if col % 2 == 0:
                add_price_ticket(f"selected_price_{row}_{col}", x, -0.443, z + 0.045, case_index, root_obj)
            cursor += width + 0.045
            case_index += 1
            col += 1
    for x in (-2.55, 2.55):
        for z in (0.30, 4.03):
            add_bolt(f"selected_bolt_{x}_{z}", (x, -0.305, z), mat_black, root_obj)
    add_empty("selected_camera_anchor", (0, -0.55, 2.25), root_obj)


def build_restricted(root_obj):
    width, height, depth = 5.4, 4.65, 0.86
    post_x = (-2.66, -0.9, 0.9, 2.66)
    for idx, x in enumerate(post_x):
        add_box(f"restricted_post_{idx + 1}", (x, 0.14, 2.13), (0.14, depth, 4.26), mat_dark_frame, 0.027, root_obj)
        for hole in range(14):
            add_box(f"restricted_post_slot_{idx + 1}_{hole + 1}", (x, -0.302, 0.42 + hole * 0.27), (0.04, 0.012, 0.09), mat_white, 0.006, root_obj)
    add_box("restricted_header_frame", (0, 0.08, 4.34), (width + 0.10, 0.53, 0.69), mat_dark_frame, 0.04, root_obj)
    add_box("restricted_header", (0, -0.205, 4.34), (width - 0.12, 0.045, 0.55), mat_dark_panel, 0.026, root_obj)
    add_text("restricted_header_text", "RESTRICTED", (0, -0.245, 4.34), 0.40, mat_restricted_sign, root_obj)
    add_box("restricted_back_panel", (0, 0.38, 2.22), (5.24, 0.06, 3.55), mat_dark_panel, 0.015, root_obj)
    add_box("restricted_base", (0, 0.13, 0.18), (5.30, 0.82, 0.30), mat_dark_frame, 0.03, root_obj)
    for foot_index, x in enumerate((-2.55, -0.86, 0.86, 2.55)):
        add_cylinder(f"restricted_foot_{foot_index + 1}", (x, 0.08, -0.02), 0.095, 0.12, mat_black, rotation=(0, 0, 0), vertices=24, parent=root_obj)
    row_z = (0.65, 1.50, 2.35, 3.20)
    for row, z in enumerate(row_z):
        add_box(f"restricted_shelf_row_{row + 1}", (0, 0.02, z), (5.18, 0.75, 0.09), mat_dark_frame, 0.018, root_obj)
        for segment in range(18):
            x = -2.43 + segment * 0.286
            stripe_mat = mat_yellow if segment % 2 == 0 else mat_black
            stripe = add_box(f"warning_stripe_{row + 1}_{segment + 1}", (x, -0.415, z + 0.06), (0.28, 0.07, 0.14), stripe_mat, 0.005, root_obj)
            stripe.rotation_euler.y = -0.45 if segment % 2 == 0 else 0.45
        add_box(f"restricted_acrylic_lip_{row + 1}", (0, -0.447, z + 0.23), (5.04, 0.028, 0.20), mat_acrylic, 0.01, root_obj)
    for bay in range(3):
        center_x = -1.78 + bay * 1.78
        add_box(f"restricted_light_housing_{bay + 1}", (center_x, -0.22, 3.93), (1.53, 0.13, 0.15), mat_dark_frame, 0.035, root_obj)
        add_box(f"restricted_light_{bay + 1}", (center_x, -0.296, 3.93), (1.42, 0.035, 0.075), mat_light_cool, 0.022, root_obj)
    disc_index = 0
    for row, z in enumerate(row_z):
        for col in range(10):
            x = -2.25 + col * 0.50
            add_restricted_media(root_obj, x, z, disc_index, row)
            add_price_ticket(f"restricted_price_{row}_{col}", x, -0.443, z + 0.045, disc_index, root_obj)
            disc_index += 1
    # Simple wire guards: shared low-poly rods rather than thousands of wires.
    for row, z in enumerate(row_z):
        guard_z = z + 0.35
        add_box(f"wire_horizontal_{row + 1}", (0, -0.455, guard_z), (5.12, 0.035, 0.035), mat_black, 0.008, root_obj)
        for line in range(16):
            x = -2.5 + line * (5.0 / 15)
            add_box(f"wire_vertical_{row + 1}_{line + 1}", (x, -0.455, guard_z), (0.025, 0.035, 0.67), mat_black, 0.006, root_obj)
    add_cylinder("warning_beacon_base", (2.46, 0.0, 4.71), 0.21, 0.17, mat_black, rotation=(0, 0, 0), vertices=48, parent=root_obj)
    add_cylinder("warning_beacon_core", (2.46, 0.0, 4.88), 0.09, 0.25, mat_beacon_glow, rotation=(0, 0, 0), vertices=32, parent=root_obj)
    add_cylinder("warning_beacon", (2.46, 0.0, 4.90), 0.17, 0.31, mat_clear, rotation=(0, 0, 0), vertices=48, parent=root_obj)
    for x in (-2.55, 2.55):
        for z in (0.30, 4.03):
            add_bolt(f"restricted_bolt_{x}_{z}", (x, -0.305, z), mat_white, root_obj)
    add_empty("restricted_camera_anchor", (0, -0.55, 2.25), root_obj)
    add_empty("pickup_disc_anchor", (0.32, -0.55, 2.0), root_obj)


build_selected(selected_root)
build_restricted(restricted_root)

# Restrained local spill makes the headers read as ordinary retail lightboxes.
add_point_light("_selected_sign_spill", (-3.15, -0.78, 4.34), 72, (1.0, 0.80, 0.58), 0.72)
add_point_light("_restricted_sign_spill", (3.15, -0.70, 4.35), 86, (1.0, 0.025, 0.018), 0.62)
add_point_light("_restricted_beacon_spill", (5.61, -0.28, 4.88), 54, (1.0, 0.01, 0.008), 0.34)

# High-resolution transition props are rendered offline and animated as flat assets in the site.
transition_cover = add_empty("_transition_cover_root", (0.0, 0.0, 0.0))
add_box("_transition_cover_case", (15.0, 0.0, 2.0), (3.0, 0.14, 3.0), mat_acrylic, 0.055, transition_cover)
add_box("_transition_cover_paper", (15.0, -0.085, 2.0), (2.86, 0.035, 2.86), mat_white, 0.032, transition_cover)
add_box("_transition_cover_rule_top", (15.0, -0.109, 3.20), (2.35, 0.012, 0.025), mat_ink, 0.004, transition_cover)
add_box("_transition_cover_rule_bottom", (15.0, -0.109, 0.80), (2.35, 0.012, 0.025), mat_ink, 0.004, transition_cover)
add_box("_transition_cover_accent", (14.16, -0.112, 2.0), (0.16, 0.012, 1.82), mat_red, 0.008, transition_cover)
add_text("_transition_cover_title", "PROJECT ARCHIVE", (15.0, -0.128, 2.62), 0.19, mat_ink, transition_cover)
add_text("_transition_cover_name", "SELECTED / 01", (15.0, -0.128, 1.96), 0.25, mat_ink, transition_cover)
add_text("_transition_cover_note", "CURATED WORKS", (15.0, -0.128, 1.40), 0.14, mat_ink, transition_cover)

transition_disc = add_empty("_transition_disc_root", (0.0, 0.0, 0.0))
add_cylinder("_transition_disc", (20.0, 0.0, 2.0), 1.48, 0.095, mat_vinyl, vertices=160, parent=transition_disc)
add_cylinder("_transition_disc_label", (20.0, -0.064, 2.0), 0.48, 0.025, mat_red, vertices=96, parent=transition_disc)
add_cylinder("_transition_disc_hub", (20.0, -0.084, 2.0), 0.075, 0.028, mat_black, vertices=48, parent=transition_disc)
add_box("_transition_disc_hazard", (20.85, -0.08, 1.18), (0.48, 0.035, 0.56), mat_yellow, 0.018, transition_disc)
add_text("_transition_disc_mark", "!", (20.85, -0.107, 1.18), 0.30, mat_black, transition_disc)
add_text("_transition_disc_title", "RESTRICTED", (20.0, -0.097, 2.15), 0.14, mat_black, transition_disc)
add_text("_transition_disc_sub", "CULT MEDIA", (20.0, -0.097, 1.86), 0.12, mat_black, transition_disc)

for obj in transition_cover.children_recursive:
    obj.hide_render = True
for obj in transition_disc.children_recursive:
    obj.hide_render = True

add_empty("camera_target_overview", (0, 0, 2.2), root)
add_empty("camera_target_selected", (-3.15, 0, 2.25), root)
add_empty("camera_target_restricted", (3.15, 0, 2.25), root)

# Preview-only floor and lighting are excluded from GLB export.
preview_floor = add_box("_preview_floor", (0, 0.55, -0.14), (14.5, 7.0, 0.12), mat_floor, 0.04)
preview_floor["export"] = False
preview_floor.hide_render = True

add_area_light("_preview_key", (-4.5, -6.0, 8.0), 1150, (1.0, 0.88, 0.73), (5.0, 5.0), rotation=(math.radians(30), 0, math.radians(-20)))
add_area_light("_preview_fill", (4.8, -4.0, 7.0), 900, (0.55, 0.77, 1.0), (4.0, 4.0), rotation=(math.radians(35), 0, math.radians(22)))
add_area_light("_preview_top", (0, 1.5, 9.0), 1000, (1.0, 1.0, 1.0), (7.0, 5.0), rotation=(0, 0, 0))

camera_data = bpy.data.cameras.new("camera_overview")
camera_data.lens = 58
camera_data.sensor_width = 36
camera = bpy.data.objects.new("camera_overview", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (0, -16.2, 4.65)
track_camera(camera, (0, 0.05, 2.25))
scene.camera = camera


def render_view(filename, location, target, lens=58, resolution=(1600, 900), directory=QUALITY_DIR, file_format="PNG"):
    camera.location = location
    camera.data.lens = lens
    track_camera(camera, target)
    scene.render.resolution_x = resolution[0]
    scene.render.resolution_y = resolution[1]
    scene.render.image_settings.file_format = file_format
    scene.render.image_settings.color_mode = "RGBA"
    if file_format == "WEBP":
        scene.render.image_settings.quality = 95
    scene.render.filepath = os.path.join(directory, filename)
    bpy.ops.render.render(write_still=True)
    print(f"WROTE_RENDER={scene.render.filepath}")


render_view("01-overview.png", (0, -22.0, 5.0), (0, 0.05, 2.25), 58)
render_view("02-selected-close.png", (-3.15, -11.0, 3.72), (-3.15, 0.05, 2.28), 61)
render_view("04-restricted-close.png", (3.15, -11.0, 3.78), (3.15, 0.05, 2.30), 61)

# Render transition props in isolation with the same material language.
for obj in root.children_recursive:
    obj.hide_render = True
for obj in transition_cover.children_recursive:
    obj.hide_render = False
render_view("03-selected-cover-close.png", (15.0, -7.2, 2.0), (15.0, 0.0, 2.0), 70, (3072, 3072))
render_view("selected-cover.webp", (15.0, -7.2, 2.0), (15.0, 0.0, 2.0), 70, (3072, 3072), TRANSITION_DIR, "WEBP")
for obj in transition_cover.children_recursive:
    obj.hide_render = True
for obj in transition_disc.children_recursive:
    obj.hide_render = False
render_view("05-restricted-disc-close.png", (20.0, -7.0, 2.0), (20.0, 0.0, 2.0), 70, (3072, 3072))
render_view("restricted-disc.webp", (20.0, -7.0, 2.0), (20.0, 0.0, 2.0), 70, (3072, 3072), TRANSITION_DIR, "WEBP")
for obj in root.children_recursive:
    obj.hide_render = False
for obj in transition_disc.children_recursive:
    obj.hide_render = True

# Select only model hierarchy for GLB export.
bpy.ops.object.select_all(action="DESELECT")
export_objects = []
def belongs_to_model(obj):
    current = obj
    while current is not None:
        if current == root:
            return True
        current = current.parent
    return False

for obj in bpy.context.scene.objects:
    if belongs_to_model(obj):
        obj.select_set(True)
        export_objects.append(obj)
bpy.context.view_layer.objects.active = root

bpy.ops.export_scene.gltf(
    filepath=GLB_PATH,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
)
print(f"WROTE_GLB={GLB_PATH}")

bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
print(f"WROTE_BLEND={BLEND_PATH}")
