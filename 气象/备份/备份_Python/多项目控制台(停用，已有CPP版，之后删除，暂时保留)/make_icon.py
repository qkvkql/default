from PIL import Image, ImageDraw, ImageFont
import os

def create_icon():
    # 1. Configuration (Size and Colors)
    size = (256, 256) # High res for Windows
    bg_color = "#2b2b2b" # Dark Grey (VS Code style)
    text_color = "#39ff14" # Neon Green (Hacker terminal style)
    
    # 2. Create a transparent image
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 3. Draw a Circle Background
    # We leave a small padding so it looks nice
    padding = 10
    draw.ellipse(
        [padding, padding, size[0]-padding, size[1]-padding], 
        fill=bg_color, 
        outline=None
    )

    # 4. Draw the Text ">_"
    # We try to use a default font, scaling it up
    try:
        # Try to find a nice monospace font on Windows
        font = ImageFont.truetype("consola.ttf", 140)
    except IOError:
        # Fallback if Consolas isn't found
        font = ImageFont.load_default()
        print("Standard font not found, using default (might look small).")

    text = ">_"
    
    # Calculate text position to center it
    # getbbox returns (left, top, right, bottom)
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    text_width = right - left
    text_height = bottom - top
    
    x = (size[0] - text_width) / 2
    # Adjust y slightly because fonts have different baselines
    y = (size[1] - text_height) / 2 - 20 

    draw.text((x, y), text, font=font, fill=text_color)

    # 5. Save as .ico
    output_filename = "manager.ico"
    img.save(output_filename, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    
    print(f"Success! '{output_filename}' has been created in this folder.")

if __name__ == "__main__":
    create_icon()