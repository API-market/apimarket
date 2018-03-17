import requests

images = [
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif',
    'https://media.giphy.com/media/FaKV1cVKlVRxC/giphy.gif'
]

for image in images:
    response = requests.post('http://localhost:8000', data=image)
    print(response.text)
