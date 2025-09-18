import bcrypt

def check_password_with_normalization(plain_password: str, hashed: str) -> bool:
    pw = plain_password.encode('utf-8')
    hash_bytes = hashed.encode('utf-8')
    if hashed.startswith('$2y$'):
        # Normalize to $2b$
        hash_bytes = b'$2b$' + hash_bytes[4:]
    try:
        return bcrypt.checkpw(pw, hash_bytes)
    except Exception as e:
        print('Error during bcrypt check:', e)
        return False


if __name__ == '__main__':
    hash_example = '$2y$10$7RrNBZmcesal0Uv0e7bc5.WmkRcLMYkh7QmfNXNb9RCrJdA/Dzdn.'
    print('Checking correct password 111111:')
    print(check_password_with_normalization('111111', hash_example))
    print('Checking wrong password 123456:')
    print(check_password_with_normalization('123456', hash_example))
