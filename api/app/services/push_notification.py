import httpx, asyncio
from app.models.user import User, UserDevice
from app.models.post import Post
from app.models.claim import Claim
from app.models.follow import Follow
from app.models.thread import Thread
from app.models.notification import Notification
from app.core.dependencies import AsyncSessionLocal
from app.utils.utils import commit_to_db
from sqlalchemy import select

LIMIT = 10
MAX_RETRIES = 3

async def send_expo_pushnotif(token: str, title: str, body: str, semaphore: asyncio.Semaphore = None):
    print("Start Send expo noti")
    async with semaphore:
        for attempt in range(1, MAX_RETRIES+1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json={
                            "to": token,
                            "title": title,
                            "body": body,
                            "sound": "default"
                        },
                        timeout=10.0
                    )
                    response_data = response.json()
                    if response_data.get("status") == "error":
                        print(f"[Expo error] {token}: {response_data.get('message')}")
                        return None
                    print(response_data)
                    return response_data
            #Gửi thông báo lại nếu fail
            except httpx.RequestError as e:
                print(f"[Attempt {attempt}] Network error: {e}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(2**attempt)  
                else:
                    print(f"Failed to send notification to {token} after {MAX_RETRIES} tries")
                    return None
            
    
async def notify_followers(thread_id: int, post_id: int):
    async with AsyncSessionLocal() as session:
        print("Start nofi follow")
        result = await session.execute (
            select(User.id, UserDevice.device_push_token)
            .join(Follow, Follow.usr_id == User.id)
            .join(UserDevice, UserDevice.usr_id == User.id)
            .where(Follow.thread_id == thread_id)
        )
        rows = result.all()
        tokens = [r.device_push_token for r in rows if r.device_push_token.startswith("ExponentPushToken")]
        usr_ids = [r.id for r in rows]
        if not tokens:
            print("No followers with valid device tokens")
            return {"message": "No followers with valid device tokens"}
    
        res = await session.execute(select(Thread.thread_name).where(Thread.id==thread_id))
        building = res.scalar_one_or_none()

        semaphore = asyncio.Semaphore(LIMIT)
        tasks = [asyncio.create_task(send_expo_pushnotif(
                    token,
                    f"New post in {building}", 
                    f"Someone just posted a new lost item in {building}",
                    semaphore
                )
            )
            for token in tokens
        ]
        results = await asyncio.gather(*tasks)

        for uid in usr_ids:
            notif = Notification(
                usr_id = uid,
                title = f"New item posted in {building}",
                noti_message = f"Someone just posted a new lost item in {building}",
                post_id = post_id
            )
            session.add(notif)

        await commit_to_db(session)

    return {"sent": len(results), "tokens_notified": len(tokens)}


async def notify_reporter(post_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDevice.device_push_token)
            .join(User, UserDevice.usr_id == User.id)
            .join(Post, Post.usr_id == User.id)
            .where(Post.id == post_id)
        )
        reporter_device_tokens = [row for row in result.scalars().all() if row.startswith("ExponentPushToken")]
        if not reporter_device_tokens:
            print("BRUH2")
            return {"message": "Reporter has no valid device token"}
        
        post_title = await session.execute(select(Post.title).where(Post.id == post_id))
        tasks = [asyncio.create_task(send_expo_pushnotif(
                    token,
                    "New claimer!", 
                    f"Someone just submitted a claim for {post_title}",
                )
            )
            for token in reporter_device_tokens
        ]
        results = await asyncio.gather(*tasks)

    return{"sent": len(results), "tokens_notified": len(reporter_device_tokens)}

async def notify_claimer(post_id: int, claim_id: int, status: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UserDevice.device_push_token)
            .join(User, UserDevice.usr_id == User.id)
            .join(Claim, Claim.usr_id == User.id)
            .where(Claim.id == claim_id)
        )
        claimer_device_tokens = [row for row in result.scalars().all() if row.startswith("ExponentPushToken")]
        if not claimer_device_tokens:
            print("BRUH")
            return {"message": "Claimer has no valid device token"}
        
        post_title = await session.execute(select(Post.title).where(Post.id == post_id))
        tasks = [asyncio.create_task(send_expo_pushnotif(
                    token,
                    f"Claim {status}!", 
                    f"Your claim for {post_title} was {status}. Contact support if you need more help.",
                )
            )
            for token in claimer_device_tokens
        ]
        results = await asyncio.gather(*tasks)

    return{"sent": len(results), "tokens_notified": len(claimer_device_tokens)}
