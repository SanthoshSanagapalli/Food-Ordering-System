-- =========================================
-- Food Ordering System Database
-- =========================================

CREATE DATABASE IF NOT EXISTS food;
USE food;

-- =========================================
-- USERS TABLE
-- =========================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- ADMINS TABLE
-- =========================================
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- =========================================
-- FOOD ITEMS TABLE
-- =========================================
CREATE TABLE food_items (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    food_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    availability ENUM('Available','Unavailable') DEFAULT 'Available',
    veg TINYINT(1) NOT NULL
);

-- =========================================
-- CART TABLE
-- =========================================
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- CART ITEMS TABLE
-- =========================================
CREATE TABLE cart_items (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1
);

-- =========================================
-- ORDERS TABLE
-- =========================================
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending','Preparing','Delivered') DEFAULT 'Pending'
);

-- =========================================
-- ORDER ITEMS TABLE
-- =========================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL
);


-- =========================================
-- SAMPLE FOOD ITEMS
-- =========================================

INSERT INTO food_items
(food_id, food_name, category, description, price, image, availability, veg)
VALUES
(1, 'Chicken Biryani', 'Biryani',
'Aromatic basmati rice cooked with tender chicken and traditional Indian spices.',
249.00, 'biryani.jpeg', 'Available', 0),

(2, 'Masala Dosa', 'Dosa',
'Crispy South Indian dosa filled with a flavorful potato masala and served with chutney.',
99.00, 'dosa.jpeg', 'Available', 1),

(3, 'Veg Thali', 'Thali',
'A complete Indian meal served with rice, roti, dal, vegetables and accompaniments.',
179.00, 'thali.jpeg', 'Available', 1),

(4, 'Veg Dum Biryani', 'Biryani',
'Fragrant basmati rice slow-cooked with fresh vegetables and aromatic spices.',
199.00, 'vegdum.jpeg', 'Available', 0),

(5, 'Paneer Butter Masala', 'Main Course',
'Soft paneer cubes cooked in a rich and creamy tomato-based gravy.',
229.00, 'paneer-butter-masala.jpeg', 'Available', 0),

(6, 'Samosa', 'Snacks',
'Crispy pastry filled with a spicy potato and pea mixture.',
40.00, 'samosa.jpeg', 'Available', 1),

(7, 'Onion Pakoda', 'Snacks',
'Crispy onion fritters prepared with gram flour and traditional Indian spices.',
79.00, 'onionpakoda.jpeg', 'Available', 1),

(8, 'Rava Dosa', 'Dosa',
'Thin and crispy South Indian dosa made with semolina and aromatic spices.',
119.00, 'ravadosa.jpeg', 'Available', 1),

(9, 'Rasmalai', 'Dessert',
'Soft cottage cheese dumplings soaked in sweet and creamy saffron-flavoured milk.',
99.00, 'rasmalai.jpeg', 'Available', 1),

(10, 'Gulab Jamun', 'Dessert',
'Soft milk-based dumplings soaked in fragrant sugar syrup.',
79.00, 'gulabjamun.jpeg', 'Available', 1),

(11, 'Masala Chai', 'Beverage',
'Traditional Indian tea brewed with milk and aromatic spices.',
40.00, 'masalachai.jpeg', 'Available', 1),

(12, 'Sweet Lassi', 'Beverage',
'Refreshing traditional yogurt-based drink served chilled.',
69.00, 'sweet-lassi.jpeg', 'Available', 1);