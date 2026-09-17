import pytest
from app.ast_parser.python_parser import PythonASTParser

TEST_SOURCE = '''
import os
import sys

def authenticate_user(username: str, password: str) -> bool:
    """Validate user credentials."""
    if not username or not password:
        return False
    user = db.find_user(username)
    if user and verify_hash(password, user.password_hash):
        return True
    return False

class AuthMiddleware:
    """Authentication middleware."""
    
    def __init__(self, app):
        self.app = app
    
    def verify_token(self, token: str) -> dict:
        """Verify JWT token."""
        try:
            payload = jwt.decode(token, SECRET_KEY)
            return payload
        except jwt.InvalidTokenError:
            raise AuthError("Invalid token")
    
    def process_request(self, request):
        token = request.headers.get("Authorization")
        if token:
            return self.verify_token(token)
        raise AuthError("No token provided")

def check_permission(user, resource, action):
    """Check if user has permission for action on resource."""
    role = user.get("role", "viewer")
    if role == "admin":
        return True
    if action == "read":
        return True
    return False
'''

def test_python_ast_parser():
    parser = PythonASTParser()
    chunks = parser.parse("test.py", TEST_SOURCE, "repo1")
    
    # Check func extraction
    auth_func = next((c for c in chunks if c.symbol_name == "authenticate_user"), None)
    assert auth_func is not None
    assert auth_func.symbol_type == "function"
    assert auth_func.start_line == 5
    assert auth_func.end_line == 12
    assert "def authenticate_user" in auth_func.source_code
    
    # Check class extraction
    auth_class = next((c for c in chunks if c.symbol_type == "class" and c.symbol_name == "AuthMiddleware"), None)
    assert auth_class is not None
    assert auth_class.start_line == 14
    assert auth_class.end_line == 32
    
    # Check method extraction
    verify_method = next((c for c in chunks if c.symbol_type == "method" and c.symbol_name == "verify_token"), None)
    assert verify_method is not None
    assert verify_method.class_name == "AuthMiddleware"
    assert verify_method.start_line == 20
    assert verify_method.end_line == 26
    
    # Check another method
    process_method = next((c for c in chunks if c.symbol_name == "process_request"), None)
    assert process_method is not None
    
    # Check module
    module_chunk = next((c for c in chunks if c.symbol_type == "module"), None)
    assert module_chunk is not None
    assert "import os" in module_chunk.source_code
