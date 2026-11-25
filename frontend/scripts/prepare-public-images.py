"""Optimize supplied marketing artwork: python prepare-public-images.py SOURCE_DIRECTORY."""
from pathlib import Path
import sys
from PIL import Image
sources = {
    'operations': 'Transportation Software Banner.png',
    'platform': 'Transportation Dashboard Interface.png',
    'mobile': 'Transportation Management Platform (1).png',
    'transformation': 'Software Transformation Infographic (1).png',
}
output = Path(__file__).resolve().parents[1] / 'public/images/platform'
output.mkdir(parents=True, exist_ok=True)
for name, filename in sources.items():
    with Image.open(Path(sys.argv[1]) / filename) as original:
        for width in (640, 960, 1600):
            image = original.convert('RGB')
            image = image.resize((width, round(original.height * width / original.width)), Image.Resampling.LANCZOS)
            target = output / f'{name}-{width}.webp'
            image.save(target, 'WEBP', quality=86, method=6)
            print(target.name, image.size, target.stat().st_size)
