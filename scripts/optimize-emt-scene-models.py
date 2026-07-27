import os
from pathlib import Path

import bpy


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "public" / "models" / "emt-scene" / "custom"
TARGETS = {
    "ambulance.glb": ("ambulance-optimized.glb", 120_000),
    "first-aid-bag.glb": ("first-aid-bag-optimized.glb", 50_000),
    "patient.glb": ("patient-optimized.glb", 120_000),
}


def triangle_count(mesh_objects):
    return sum(
        max(0, len(polygon.vertices) - 2)
        for obj in mesh_objects
        for polygon in obj.data.polygons
    )


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def optimize_model(source_name, output_name, target_triangles):
    clear_scene()
    source = MODEL_DIR / source_name
    output = MODEL_DIR / output_name
    bpy.ops.import_scene.gltf(filepath=str(source))

    mesh_objects = [
        obj for obj in bpy.context.scene.objects if obj.type == "MESH"
    ]
    original_triangles = triangle_count(mesh_objects)
    ratio = min(1.0, target_triangles / max(1, original_triangles))

    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new(name="PathoLogix scene optimization", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)

    optimized_triangles = triangle_count(mesh_objects)
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_image_format="WEBP",
        export_image_quality=82,
        export_image_webp_fallback=False,
    )

    print(
        f"{source_name}: {original_triangles:,} -> "
        f"{optimized_triangles:,} triangles, "
        f"{os.path.getsize(source):,} -> {os.path.getsize(output):,} bytes"
    )


for source_name, (output_name, target_triangles) in TARGETS.items():
    optimize_model(source_name, output_name, target_triangles)
