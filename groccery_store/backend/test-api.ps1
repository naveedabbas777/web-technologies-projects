# API Test Script for Online Grocery Delivery System

$baseUrl = "http://localhost:5000/api"
$headers = @{"Content-Type" = "application/json"}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body,
        [string]$Token
    )
    
    Write-Host "`n📌 Testing: $Name" -ForegroundColor Cyan
    
    try {
        $url = "$baseUrl$Endpoint"
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $headers
        }
        
        if ($Token) {
            $params.Headers["Authorization"] = "Bearer $Token"
        }
        
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)"
        Write-Host "Response: $(($content | ConvertTo-Json -Depth 2 | Select-Object -First 5) -join "`n")"
        
        return $content
    }
    catch {
        Write-Host "❌ Error!" -ForegroundColor Red
        Write-Host "Message: $($_.Exception.Message)"
        return $null
    }
}

Write-Host "🚀 Starting API Tests" -ForegroundColor Yellow

# Test 1: Get all products
$products = Test-Endpoint -Name "Get All Products" -Method "Get" -Endpoint "/products"

# Test 2: Login
$loginBody = @{
    email = "customer@example.com"
    password = "password123"
}
$loginResponse = Test-Endpoint -Name "Login" -Method "Post" -Endpoint "/auth/login" -Body $loginBody

if ($loginResponse) {
    $token = $loginResponse.token
    Write-Host "🔐 Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    # Test 3: Get user profile
    Test-Endpoint -Name "Get User Profile" -Method "Get" -Endpoint "/auth/profile" -Token $token
    
    # Test 4: Get cart
    Test-Endpoint -Name "Get Cart" -Method "Get" -Endpoint "/cart" -Token $token
    
    # Test 5: Add to cart (if we have a product)
    if ($products -and $products.products) {
        $productId = $products.products[0]._id
        $addToCartBody = @{
            product_id = $productId
            quantity = 2
        }
        Test-Endpoint -Name "Add to Cart" -Method "Post" -Endpoint "/cart/add" -Body $addToCartBody -Token $token
    }
}

# Test 6: Get product categories
Test-Endpoint -Name "Get Product Categories" -Method "Get" -Endpoint "/products/categories"

# Test 7: Health check
Test-Endpoint -Name "Health Check" -Method "Get" -Endpoint "/health"

Write-Host "`n✨ API Tests Completed!" -ForegroundColor Yellow
