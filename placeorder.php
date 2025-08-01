<?php
// Prevent any output before JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);

header('Content-Type: application/json');

// Check if autoload exists
if (!file_exists('vendor/autoload.php')) {
    echo json_encode([
        'success' => false,
        'message' => 'Composer autoload not found. Please run: composer install'
    ]);
    exit;
}

require_once 'vendor/autoload.php';

// Gunakan library Midtrans
use Midtrans\Config;
use Midtrans\Snap;

// Konfigurasi Midtrans menggunakan library
Config::$serverKey = '';
Config::$clientKey = '';
Config::$isProduction = false; // Set true untuk production
Config::$isSanitized = true; // Set true untuk data sanitization
Config::$is3ds = true; // Set true untuk 3D Secure

try {
    // Ambil data dari request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validasi data yang diperlukan
    if (!isset($input['customer']) || !isset($input['items']) || !isset($input['total'])) {
        throw new Exception('Missing required data');
    }
    
    $customer = $input['customer'];
    $items = $input['items'];
    $total = $input['total'];
    
    // Generate order ID yang unik
    $order_id = 'KS-' . date('YmdHis') . '-' . rand(1000, 9999);
    
    // Format item details untuk Midtrans
    $item_details = [];
    foreach ($items as $item) {
        $item_details[] = [
            'id' => $item['id'],
            'price' => (int)$item['price'],
            'quantity' => (int)$item['quantity'],
            'name' => $item['name']
        ];
    }
    
    // Transaction parameters
    $params = [
        'transaction_details' => [
            'order_id' => $order_id,
            'gross_amount' => (int)$total,
        ],
        'customer_details' => [
            'first_name' => $customer['name'],
            'email' => $customer['email'],
            'phone' => $customer['phone'],
        ],
        'item_details' => $item_details,
        'callbacks' => [
            'finish' => 'http://localhost/kominfo1/?status=success'
        ]
    ];
    
    // Dapatkan Snap Token menggunakan library
    $snapToken = Snap::getSnapToken($params);
    
    // Return snap token untuk frontend
    echo json_encode([
        'success' => true,
        'snap_token' => $snapToken,
        'order_id' => $order_id
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>