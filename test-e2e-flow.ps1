#!/usr/bin/env pwsh
# End-to-end test: Cart creation → Order creation → Order retrieval

$sessionId = [guid]::NewGuid().ToString()
$uniquePhone = "300$(Get-Random -Minimum 1000000 -Maximum 9999999)"

Write-Host "=== E2E Flow Validation ===" -ForegroundColor Green
Write-Host "Session ID: $sessionId" -ForegroundColor Cyan
Write-Host "Test Phone: $uniquePhone`n" -ForegroundColor Cyan

# Create session for cookie handling
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    # 1. CREATE CART
    Write-Host "1️⃣  Creating cart..." -ForegroundColor Yellow
    $cartBody = @{
        items = @(@{ productId = "cmnbrumyy003il0tsup7oh1nn"; quantity = 2 })
        cityId = $null
    } | ConvertTo-Json

    $cartRes = Invoke-WebRequest -Uri "http://localhost:3000/api/carts" `
        -Method POST `
        -Headers @{ "x-session-id" = $sessionId; "Content-Type" = "application/json" } `
        -Body $cartBody `
        -WebSession $webSession `
        -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

    if (-not $cartRes.success) {
        Write-Host "❌ Cart creation failed: $($cartRes.error)" -ForegroundColor Red
        exit 1
    }

    $cartId = $cartRes.data.id
    Write-Host "✅ Cart created: $cartId" -ForegroundColor Green

    # Get updated session ID from cookies
    $cookies = $webSession.Cookies.GetCookies("http://localhost:3000")
    $sessionCookie = $cookies | Where-Object { $_.Name -eq "x-session-id" } | Select-Object -First 1
    if ($sessionCookie) {
        $sessionId = $sessionCookie.Value
        Write-Host "  Session ID updated: $sessionId" -ForegroundColor Gray
    }

    # 2. CREATE ORDER
    Write-Host "`n2️⃣  Creating order..." -ForegroundColor Yellow
    $orderBody = @{
        cartId = $cartId
        customerPhone = $uniquePhone
        cityId = $null
    } | ConvertTo-Json

    $orderRes = Invoke-WebRequest -Uri "http://localhost:3000/api/orders" `
        -Method POST `
        -Headers @{ "x-session-id" = $sessionId; "Content-Type" = "application/json" } `
        -Body $orderBody `
        -WebSession $webSession `
        -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

    if (-not $orderRes.success) {
        Write-Host "❌ Order creation failed: $($orderRes.message)" -ForegroundColor Red
        Write-Host "Response: $($orderRes | ConvertTo-Json)" -ForegroundColor Yellow
        exit 1
    }

    $orderNumber = $orderRes.data.orderNumber
    Write-Host "✅ Order created: #$orderNumber" -ForegroundColor Green

    # 3. RETRIEVE ORDERS
    Write-Host "`n3️⃣  Retrieving orders for session..." -ForegroundColor Yellow
    $ordersRes = Invoke-WebRequest -Uri "http://localhost:3000/api/orders/mine" `
        -Method GET `
        -Headers @{ "x-session-id" = $sessionId; "Content-Type" = "application/json" } `
        -WebSession $webSession `
        -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json

    if (-not $ordersRes.success) {
        Write-Host "❌ Order retrieval failed" -ForegroundColor Red
        exit 1
    }

    if ($ordersRes.data.Count -eq 0) {
        Write-Host "❌ No orders found in /api/orders/mine" -ForegroundColor Red
        Write-Host "This means the order wasn't linked to the session ID." -ForegroundColor Yellow
        exit 1
    }

    Write-Host "✅ Found $($ordersRes.data.Count) order(s)" -ForegroundColor Green
    foreach ($order in $ordersRes.data) {
        Write-Host "  📦 #$($order.orderNumber): Status=$($order.status), Items=$($order.items.Count), Total=$($order.subtotal)" -ForegroundColor Cyan
    }

    Write-Host "`n🎉 SUCCESS: Complete flow validated!" -ForegroundColor Green
    Write-Host "`nTest Summary:" -ForegroundColor Cyan
    Write-Host "  Session: $sessionId"
    Write-Host "  Cart: $cartId"
    Write-Host "  Order: #$orderNumber"
    Write-Host "  Orders Retrieved: $($ordersRes.data.Count)"

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
