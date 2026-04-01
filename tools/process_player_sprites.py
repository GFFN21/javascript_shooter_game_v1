from PIL import Image
import os

def process():
    try:
        input_path = "src/player_spritesheet_raw.png"
        output_path = "src/player_spritesheet.png"

        print(f"Processing {input_path}...")
        
        if not os.path.exists(input_path):
            print(f"Error: Input file {input_path} not found.")
            return

        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check for white (255,255,255)
            if item[0] >= 240 and item[1] >= 240 and item[2] >= 240:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved processed grid to {output_path}")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    process()
