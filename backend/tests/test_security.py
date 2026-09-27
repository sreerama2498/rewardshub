import os
import pytest

os.environ["SECRET_KEY"] = "test-secret-key-for-unit-testing-purposes-must-be-long-and-secure"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

def test_password_hashing():
    pwd = "SuperSecretPassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    data = {"sub": "42", "email": "test@example.com", "role": "USER"}
    token = create_access_token(data)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == "42"
    assert payload.get("email") == "test@example.com"
    assert payload.get("role") == "USER"

def test_invalid_jwt_token():
    payload = decode_access_token("invalid.token.payload")
    assert payload is None
