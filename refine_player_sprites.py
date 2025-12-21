from PIL import Image
import sys

# Increase recursion depth just in case for recursive approaches, 
# though we use iterative BFS.
sys.setrecursionlimit(10000)

def refine():
    input_path = "src/player_spritesheet_raw.png"
    output_path = "src/player_spritesheet.png"

    print(f"Refining {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # Queue for linear floodfill (BFS)
        # Start from all edges to ensure we catch all background regions
        queue = []
        visited = set()

        # Seed with border pixels
        for x in range(width):
            queue.append((x, 0))
            queue.append((x, height - 1))
            visited.add((x, 0))
            visited.add((x, height - 1))
        
        for y in range(height):
            queue.append((0, y))
            queue.append((width - 1, y))
            visited.add((0, y))
            visited.add((width - 1, y))

        processed_count = 0
        
        while queue:
            x, y = queue.pop(0)
            
            # Analyze pixel color
            r, g, b, a = pixels[x, y]
            
            # "White-ish" check with tolerance
            # Adjust tolerance as needed. 200 is safe for pure white background with some anti-aliasing.
            # If the background is solid white (255,255,255), this works.
            # If it has compression artifacts, we need this range.
            is_background = (r > 200 and g > 200 and b > 200)

            if is_background:
                # Set to transparent
                pixels[x, y] = (0, 0, 0, 0)
                processed_count += 1
                
                # Check neighbors
                # 4-connectivity is safer for contours
                neighbors = [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]
                for nx, ny in neighbors:
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited:
                            visited.add((nx, ny))
                            # We only add to queue if WE (current pixel) were background,
                            # so we continue the flood.
                            # But wait, we need to check the NEIGHBOR inside the loop? 
                            # No, standard floodfill checks neighbor in loop.
                            # Actually, we enqueue blindly and check color when popping?
                            # Or check color before pushing?
                            # Better: Check color before pushing to keep queue smaller?
                            # Standard BFS: Pop -> Process -> Add Neighbors.
                            # Here "Process" is checking color and turning transparent.
                            # If it's NOT background (hit a contour), we stop spreading from this branch.
                            queue.append((nx, ny))

            # If NOT background (e.g. black contour or character color),
            # we do NOTHING and do NOT add neighbors (stop flooding).
            
        print(f"Processed {processed_count} background pixels.")
        img.save(output_path, "PNG")
        print(f"Saved refined sprite sheet to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    refine()
