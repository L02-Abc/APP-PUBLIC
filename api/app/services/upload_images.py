import cloudinary, cloudinary.uploader, asyncio
from typing import List, BinaryIO
from cloudinary import CloudinaryImage
from cloudinary.exceptions import Error
from fastapi import UploadFile
from app.models.post import PostImage
from app.core.dependencies import AsyncSessionLocal
from app.utils.utils import commit_to_db

async def upload_to_cloudinary(file: BinaryIO, filename:str, settings: dict, post_id: int):
    cloudinary.config( 
        cloud_name = settings["CLOUDINARY_CLOUD_NAME"], 
        api_key = settings["CLOUDINARY_API_KEY"], 
        api_secret = settings["CLOUDINARY_API_SECRET"],
        secure=True
    )
    public_id = f"post_{post_id}_{hash(filename)%100000}"
    try:
        cloudinary.uploader.upload(file, public_id=public_id, unique_filename=False, overwrite=True)
    except Error as e:
        print(f"Error when uploading to Cloudinary: {e}")
        return None

    return CloudinaryImage(public_id=public_id).build_url()
    

async def upload_images(files: List[UploadFile], settings: dict, post_id: int):
    tasks = [
        asyncio.create_task(upload_to_cloudinary(file.file, file.filename, settings, post_id))
        for file in files
    ]
    urls = await asyncio.gather(*tasks)
    valid_urls = [url for url in urls if url]
    async with AsyncSessionLocal() as session:
        for url in valid_urls:
            new_postimage = PostImage(post_id = post_id, url=url)
            session.add(new_postimage)

        await commit_to_db(session)
        await session.refresh(new_postimage)
    #print(valid_urls)
    return valid_urls
