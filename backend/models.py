def user_schema(user):
    return {
        "email": user["email"],
        "password": user["password"]
    }

def product_schema(product):
    return {
        "name": product["name"],
        "price": product["price"],
        "quantity": product["quantity"]
    }