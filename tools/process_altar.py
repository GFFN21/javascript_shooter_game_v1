from PIL import Image

def process():
    try:
        print("Opening image...")
        img = Image.open("mayan_altar_black_bg.png").convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check for black (0,0,0)
            if item[0] <= 5 and item[1] <= 5 and item[2] <= 5:
                newData.append((0, 0, 0, 0)) # Transparent
            else:
                newData.append(item)
        
        img.putdata(newData)
        img.save("src/mayan_altar.png", "PNG")
        print("Successfully processed transparency!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    process()
