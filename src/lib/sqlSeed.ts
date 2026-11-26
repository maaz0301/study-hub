// Sample "shop" database used by the SQL playground and the tutorial "Try it" runner.
export const SEED = `
CREATE TABLE customers (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, city TEXT, created_at DATE NOT NULL);
CREATE TABLE products (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, price NUMERIC(10,2) NOT NULL CHECK (price >= 0), stock INT NOT NULL DEFAULT 0, attrs JSONB);
CREATE TABLE orders (id SERIAL PRIMARY KEY, customer_id INT REFERENCES customers(id), status TEXT NOT NULL, created_at DATE NOT NULL);
CREATE TABLE order_items (order_id INT REFERENCES orders(id), product_id INT REFERENCES products(id), qty INT NOT NULL, price NUMERIC(10,2) NOT NULL, PRIMARY KEY (order_id, product_id));
CREATE TABLE employees (id SERIAL PRIMARY KEY, name TEXT, title TEXT, manager_id INT REFERENCES employees(id), salary INT);

INSERT INTO customers (name, email, city, created_at) VALUES
 ('Ayesha Khan','ayesha@example.com','Lahore','2024-02-11'), ('Bilal Ahmed','bilal@example.com','Karachi','2023-11-03'),
 ('Sara Malik','sara@example.com','Islamabad','2025-01-20'), ('Omar Farooq','omar@example.com','Lahore','2022-06-15'),
 ('Hina Raza','hina@example.com','Karachi','2024-08-30'), ('Usman Tariq','usman@example.com','Peshawar','2025-03-02'),
 ('Zara Iqbal','zara@example.com','Lahore','2025-04-18');
INSERT INTO products (name, category, price, stock, attrs) VALUES
 ('Gel Pen','office',2.50,120,'{"color":"blue","brand":"Inko"}'), ('Notebook','office',6.00,40,'{"pages":120}'),
 ('Desk Lamp','home',32.00,8,'{"watts":9,"brand":"Lumo"}'), ('Mug','home',9.00,0,'{"color":"white"}'),
 ('Headphones','tech',79.00,15,'{"wireless":true,"brand":"Sonic"}'), ('USB-C Cable','tech',12.00,200,'{"length_m":1}'),
 ('Keyboard','tech',49.00,5,'{"wireless":false,"brand":"Sonic"}'), ('Stapler','office',14.00,22,null);
INSERT INTO orders (customer_id, status, created_at) VALUES
 (1,'paid','2025-05-01'),(2,'paid','2025-05-03'),(1,'shipped','2025-05-07'),(3,'pending','2025-05-08'),(4,'paid','2025-05-10'),
 (5,'cancelled','2025-05-11'),(2,'paid','2025-05-14'),(6,'paid','2025-05-15'),(4,'shipped','2025-05-18'),(1,'paid','2025-05-21');
INSERT INTO order_items VALUES
 (1,1,10,2.50),(1,2,3,6.00),(2,5,1,79.00),(3,3,2,32.00),(4,6,4,12.00),(4,1,2,2.50),(5,7,1,49.00),(5,5,1,79.00),
 (6,4,6,9.00),(7,6,10,12.00),(8,2,20,6.00),(8,1,50,2.50),(9,3,1,32.00),(10,8,2,14.00),(10,5,1,79.00);
INSERT INTO employees (name, title, manager_id, salary) VALUES
 ('Nadia','CEO',NULL,250000),('Kamran','CTO',1,200000),('Fatima','CFO',1,190000),('Ali','Eng Manager',2,150000),
 ('Rabia','Senior Engineer',4,120000),('Hamza','Engineer',4,95000),('Iqra','Engineer',4,95000),('Saad','Accountant',3,80000);
`;
