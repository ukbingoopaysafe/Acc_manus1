# Quick local test for password checking logic in User model
# Run this from the repository root after installing backend requirements

from src.models.auth import User

# Example hash from user (PHP bcrypt $2y$ style)
hash_example = "$2y$10$7RrNBZmcesal0Uv0e7bc5.WmkRcLMYkh7QmfNXNb9RCrJdA/Dzdn."
user = User()
user.password_hash = hash_example

print('Checking password 111111 against hash...')
print('Result:', user.check_password('111111'))

print('Checking wrong password 123456...')
print('Result:', user.check_password('123456'))
