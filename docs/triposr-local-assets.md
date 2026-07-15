# Local TripoSR Asset Generation

TripoSR is installed locally at `tools/TripoSR`.

That folder is ignored by Git because it contains a Python venv, cached model weights, and generated output. If it is missing on another machine, clone `https://github.com/VAST-AI-Research/TripoSR.git` into `tools/TripoSR` and install its local Python environment before running the commands below.

The local venv can now run `--bake-texture`. `xatlas==0.0.9` needed a small local CMake compatibility patch because its vendored `pybind11` used `cmake_minimum_required(VERSION 3.4)`, which fails with modern CMake. The working setup uses:

```bash
cd tools/TripoSR
.venv/bin/python -m pip install "cmake<4" ninja
```

Then download and patch `xatlas==0.0.9`:

```bash
mkdir -p /private/tmp/pathologic-xatlas
.venv/bin/python -m pip download --no-build-isolation --no-deps --no-binary=:all: xatlas==0.0.9 -d /private/tmp/pathologic-xatlas
tar -xzf /private/tmp/pathologic-xatlas/xatlas-0.0.9.tar.gz -C /private/tmp/pathologic-xatlas
```

In `/private/tmp/pathologic-xatlas/xatlas-0.0.9/extern/pybind11/CMakeLists.txt`, change:

```cmake
cmake_minimum_required(VERSION 3.4)
```

to:

```cmake
cmake_minimum_required(VERSION 3.5...3.22)
```

Then install the patched package:

```bash
PATH="$PWD/.venv/bin:$PATH" .venv/bin/python -m pip install --no-build-isolation /private/tmp/pathologic-xatlas/xatlas-0.0.9
```

Run this from the project root to generate the current EMT scene asset set:

```bash
cd tools/TripoSR
.venv/bin/python run.py \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_46 AM (6).png" \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_46 AM (5).png" \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_45 AM (4).png" \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_45 AM (1).png" \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_45 AM (2).png" \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_45 AM (3).png" \
  --output-dir output/pathologic-assets \
  --model-save-format glb \
  --mc-resolution 128 \
  --chunk-size 4096 \
  --foreground-ratio 0.82
```

Copy the generated meshes into the app:

```bash
cp output/pathologic-assets/0/mesh.glb ../../public/models/emt-scene/triposr/first-aid-bag.glb
cp output/pathologic-assets/1/mesh.glb ../../public/models/emt-scene/triposr/bystanders-couple.glb
cp output/pathologic-assets/2/mesh.glb ../../public/models/emt-scene/triposr/damaged-blue-car.glb
cp output/pathologic-assets/3/mesh.glb ../../public/models/emt-scene/triposr/barking-dog.glb
cp output/pathologic-assets/4/mesh.glb ../../public/models/emt-scene/triposr/lying-patient.glb
cp output/pathologic-assets/5/mesh.glb ../../public/models/emt-scene/triposr/ambulance.glb
```

For baked textures, add `--bake-texture` and `--texture-resolution`:

```bash
cd tools/TripoSR
.venv/bin/python run.py \
  "/Users/odaineforbes/Downloads/ChatGPT Image Jul 15, 2026, 12_08_46 AM (6).png" \
  --output-dir output/pathologic-assets-baked-bag \
  --model-save-format glb \
  --mc-resolution 128 \
  --chunk-size 4096 \
  --foreground-ratio 0.82 \
  --bake-texture \
  --texture-resolution 1024
```

TripoSR may write baked OBJ text to a file named `mesh.glb` alongside `texture.png`. Convert that OBJ + PNG pair into a real GLB before using it in the app:

```bash
cp tools/TripoSR/output/pathologic-assets-baked-bag/0/mesh.glb tools/TripoSR/output/pathologic-assets-baked-bag/0/mesh.obj
tools/TripoSR/.venv/bin/python scripts/convert-triposr-baked-glb.py \
  tools/TripoSR/output/pathologic-assets-baked-bag/0/mesh.obj \
  tools/TripoSR/output/pathologic-assets-baked-bag/0/texture.png \
  public/models/emt-scene/triposr/first-aid-bag-baked.glb
```
