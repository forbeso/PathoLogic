from pathlib import Path
import argparse

from PIL import Image, ImageEnhance
import trimesh
from trimesh.visual.texture import SimpleMaterial, TextureVisuals


def adjust_texture(texture: Image.Image, brightness: float, contrast: float, gamma: float) -> Image.Image:
    texture = texture.convert("RGBA")

    if gamma != 1:
        table = [round(((value / 255) ** (1 / gamma)) * 255) for value in range(256)]
        r, g, b, a = texture.split()
        texture = Image.merge("RGBA", (r.point(table), g.point(table), b.point(table), a))

    if brightness != 1:
        texture = ImageEnhance.Brightness(texture).enhance(brightness)

    if contrast != 1:
        texture = ImageEnhance.Contrast(texture).enhance(contrast)

    return texture


def convert(obj_path: Path, texture_path: Path, output_path: Path, brightness: float, contrast: float, gamma: float) -> None:
    # TripoSR's baked path may write OBJ text into a file named mesh.glb.
    mesh = trimesh.load(obj_path, force="mesh", file_type="obj")
    uv = getattr(mesh.visual, "uv", None)

    if uv is None:
        raise ValueError(f"No UV coordinates found in {obj_path}")

    texture = adjust_texture(Image.open(texture_path), brightness=brightness, contrast=contrast, gamma=gamma)
    material = SimpleMaterial(image=texture)
    mesh.visual = TextureVisuals(uv=uv, image=texture, material=material)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(output_path)
    print(f"Created {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert TripoSR baked OBJ + texture PNG output into a real GLB.")
    parser.add_argument("obj", type=Path, help="Path to TripoSR baked mesh OBJ. TripoSR may name this mesh.glb.")
    parser.add_argument("texture", type=Path, help="Path to TripoSR texture.png.")
    parser.add_argument("output", type=Path, help="Output GLB path.")
    parser.add_argument("--brightness", type=float, default=1.0, help="Texture brightness multiplier.")
    parser.add_argument("--contrast", type=float, default=1.0, help="Texture contrast multiplier.")
    parser.add_argument("--gamma", type=float, default=1.0, help="Gamma lift. Values above 1 brighten shadows.")
    args = parser.parse_args()

    convert(args.obj, args.texture, args.output, args.brightness, args.contrast, args.gamma)


if __name__ == "__main__":
    main()
