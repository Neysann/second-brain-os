import os
from PIL import Image

def generate_icons():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_jpg = os.path.join(base_dir, 'public', 'logo.jpg')
    print(f"Loading real synaptic brain logo from: {logo_jpg}")

    if not os.path.exists(logo_jpg):
        raise FileNotFoundError(f"Logo not found at {logo_jpg}")

    # Open the real synaptic brain image
    img = Image.open(logo_jpg).convert("RGBA")
    print(f"Image loaded: size={img.size}, mode={img.mode}")

    # 1. Save genuine PNGs
    png_targets = [
        os.path.join(base_dir, 'public', 'logo.png'),
        os.path.join(base_dir, 'public', 'icon.png'),
        os.path.join(base_dir, 'build', 'icon.png'),
        os.path.join(base_dir, 'electron', 'icon.png'),
        os.path.join(base_dir, 'out', 'logo.png'),
        os.path.join(base_dir, 'out', 'icon.png'),
    ]

    for p in png_targets:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        img.save(p, format="PNG")
        print(f"Saved genuine PNG: {p} ({os.path.getsize(p)} bytes)")

    # 2. Save multi-resolution Windows .ico with all standard resolutions
    # (16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256)
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_targets = [
        os.path.join(base_dir, 'build', 'icon.ico'),
        os.path.join(base_dir, 'electron', 'icon.ico'),
        os.path.join(base_dir, 'public', 'favicon.ico'),
        os.path.join(base_dir, 'public', 'icon.ico'),
        os.path.join(base_dir, 'src', 'app', 'favicon.ico'),
        os.path.join(base_dir, 'out', 'favicon.ico'),
        os.path.join(base_dir, 'out', 'icon.ico'),
    ]

    for ico_path in ico_targets:
        os.makedirs(os.path.dirname(ico_path), exist_ok=True)
        img.save(ico_path, format="ICO", sizes=ico_sizes)
        print(f"Saved multi-resolution ICO: {ico_path} ({os.path.getsize(ico_path)} bytes)")

    print("\nSUCCESS: All icons replaced with the real synaptic brain logo!")

if __name__ == '__main__':
    generate_icons()
