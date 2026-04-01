from PIL import Image
import os

def process():
    try:
        print("Opening image...")
        # Check if artifact exists or where it is.
        # Assuming the generated image is saved to the artifacts dir and we need to process it.
        # But generate_image saves to artifact dir. I might need to move it or read from there.
        # Wait, generate_image saves to 'artifacts' dir inside .gemini... 
        # I need to know the path of the generated image.
        # I will assume "mayan_portal_raw.png" is in the cwd or I'll use the path provided by the tool output.
        
        # Actually I should check where generate_image saves.
        # "The resulting image will be saved as an artifact". 
        # I will use the `process_transparency.py` approach where I read from source and write to dest.
        
        input_path = "mayan_portal_raw.png" 
        output_path = "src/mayan_portal.png"
        
        if not os.path.exists(input_path):
            # Try looking in artifacts dir if I can find it? 
            # Actually, I'll copy the file first if needed.
            print(f"Input file {input_path} not found.")
            return

        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check for black (0,0,0)
            if item[0] <= 10 and item[1] <= 10 and item[2] <= 10:
                newData.append((0, 0, 0, 0)) # Transparent
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully processed transparency to {output_path}!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process()
