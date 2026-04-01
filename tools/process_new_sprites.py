import os
from PIL import Image

def process_sprites():
    # Configuration
    base_dir = "2D explorer character sprite copy/animations"
    output_path = "src/player_spritesheet_v2.png"
    
    animations = ["breathing-idle", "running-8-frames"]
    directions = [
        "south", "south-east", "east", "north-east", 
        "north", "north-west", "west", "south-west"
    ]
    
    frame_size = 64
    max_frames = 8
    
    # Calculate Sheet Size
    # Rows: len(animations) * len(directions) = 2 * 8 = 16
    # Cols: max_frames = 8
    width = max_frames * frame_size
    height = len(animations) * len(directions) * frame_size
    
    print(f"Creating Sprite Sheet: {width}x{height}")
    
    sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    
    current_row = 0
    
    for anim in animations:
        for direction in directions:
            dir_path = os.path.join(base_dir, anim, direction)
            
            if not os.path.exists(dir_path):
                print(f"Warning: Directory not found: {dir_path}")
                current_row += 1
                continue
                
            # Get files sorted
            files = sorted([f for f in os.listdir(dir_path) if f.endswith('.png')])
            
            print(f"Processing {anim}/{direction} (Row {current_row}): {len(files)} frames")
            
            for col, filename in enumerate(files):
                if col >= max_frames:
                    break
                    
                img_path = os.path.join(dir_path, filename)
                try:
                    img = Image.open(img_path).convert("RGBA")
                    
                    # Resize if not 64x64? User said they are exact 64x64.
                    if img.size != (64, 64):
                        img = img.resize((64, 64))
                        
                    sheet.paste(img, (col * frame_size, current_row * frame_size))
                except Exception as e:
                    print(f"Error loading {img_path}: {e}")
            
            current_row += 1
            
    sheet.save(output_path)
    print(f"Saved sprite sheet to {output_path}")

if __name__ == "__main__":
    process_sprites()
