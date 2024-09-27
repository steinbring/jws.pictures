import sys
import os
import subprocess
from PIL import Image
import exifread
import json
import xml.etree.ElementTree as ET

def rename_original_image(image_path):
    base, ext = os.path.splitext(image_path)
    new_image_path = f"{base}-original{ext}"
    os.rename(image_path, new_image_path)
    # Inform git about the rename
    subprocess.run(['git', 'mv', image_path, new_image_path])
    return new_image_path

def generate_images(image_path):
    base, ext = os.path.splitext(image_path)
    formats = ['webp', 'jpeg']
    sizes = {'-large': 1.0, '-medium': 0.25, '-small': 0.1}
    new_image_paths = []
    
    with Image.open(image_path) as img:
        width, height = img.size
        for suffix, scale in sizes.items():
            new_size = (int(width * scale), int(height * scale))
            for fmt in formats:
                new_base = base.replace('-original', '') + suffix
                new_filename = f"{new_base}.{fmt}"
                img_resized = img.resize(new_size, Image.ANTIALIAS)
                img_resized.save(new_filename, format=fmt.upper(), optimize=True)
                new_image_paths.append(new_filename)
    return new_image_paths

def extract_exif_data(image_path):
    with open(image_path, 'rb') as image_file:
        tags = exifread.process_file(image_file)
    
    exif_data = {}
    # Camera: "Image Make" and "Image Model"
    make = tags.get('Image Make', '')
    model = tags.get('Image Model', '')
    exif_data['Camera'] = f"{make} {model}".strip()
    # Date and Time: "EXIF DateTimeOriginal"
    datetime_original = tags.get('EXIF DateTimeOriginal', '')
    exif_data['DateTime'] = str(datetime_original)
    # Location: "GPS GPSLatitude", "GPS GPSLongitude"
    gps_latitude = tags.get('GPS GPSLatitude')
    gps_latitude_ref = tags.get('GPS GPSLatitudeRef')
    gps_longitude = tags.get('GPS GPSLongitude')
    gps_longitude_ref = tags.get('GPS GPSLongitudeRef')
    
    if gps_latitude and gps_longitude and gps_latitude_ref and gps_longitude_ref:
        lat = _convert_to_degrees(gps_latitude)
        if gps_latitude_ref.values != 'N':
            lat = -lat
        lon = _convert_to_degrees(gps_longitude)
        if gps_longitude_ref.values != 'E':
            lon = -lon
        exif_data['Location'] = {'Latitude': lat, 'Longitude': lon}
    else:
        exif_data['Location'] = {}
    return exif_data

def _convert_to_degrees(value):
    # Helper function to convert GPS coordinates stored in EXIF to degrees in float format
    d = value.values[0]
    m = value.values[1]
    s = value.values[2]
    d = float(d.num) / float(d.den)
    m = float(m.num) / float(m.den)
    s = float(s.num) / float(s.den)
    return d + (m / 60.0) + (s / 3600.0)

def save_metadata_files(exif_data, image_paths, image_path):
    data = {
        "filenames": image_paths,
        "exif": exif_data
    }
    base, _ = os.path.splitext(image_path)
    json_path = f"{base}.json"
    xml_path = f"{base}.xml"
    
    # Save JSON
    with open(json_path, 'w') as json_file:
        json.dump(data, json_file, indent=4)
    
    # Save XML
    root = ET.Element('metadata')
    filenames_el = ET.SubElement(root, 'filenames')
    for filename in image_paths:
        ET.SubElement(filenames_el, 'filename').text = filename
    
    exif_el = ET.SubElement(root, 'exif')
    for key, value in exif_data.items():
        if isinstance(value, dict):
            sub_el = ET.SubElement(exif_el, key)
            for sub_key, sub_value in value.items():
                ET.SubElement(sub_el, sub_key).text = str(sub_value)
        else:
            ET.SubElement(exif_el, key).text = str(value)
    
    tree = ET.ElementTree(root)
    tree.write(xml_path)
    
    return json_path, xml_path

if __name__ == "__main__":
    image_path = sys.argv[1]
    
    # Rename original image
    original_image_path = rename_original_image(image_path)
    
    # Generate six versions
    image_paths = generate_images(original_image_path)
    
    # Extract EXIF data
    exif_data = extract_exif_data(original_image_path)
    
    # Generate JSON and XML files
    json_path, xml_path = save_metadata_files(exif_data, image_paths, original_image_path)
    
    print(f"Generated images: {image_paths}")
    print(f"Generated metadata files: {json_path}, {xml_path}")
