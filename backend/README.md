# Starting local backend
Requirements:
    - >= Python 3.3 (for virtual environment, don't need if you want to run a different way)

# Instructions
1. cd into \backend folder
2. ensure the keys for the Supabase URL and key are filled in .env
3. run `pip install -r requirements.txt`
4. run uvicorn main:app --reload