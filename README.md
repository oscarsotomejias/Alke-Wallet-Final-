# 💰 Alke Wallet – Sistema de Billetera Digital (Proyecto Final)

## 📌 Descripción del Proyecto

**Alke Wallet** es una aplicación web de billetera digital desarrollada como proyecto final del  
**Módulo 2: Fundamentos del Desarrollo Front-End**.

El proyecto simula el funcionamiento de un sistema transaccional entre usuarios, permitiendo la creación de cuentas, depósitos de fondos, transferencias, registro de movimientos y conciliación de operaciones, utilizando únicamente tecnologías del lado del cliente.

Toda la información se gestiona mediante **localStorage**, sin backend ni base de datos externa, con fines **educativos**.

---

## 🚀 Funcionalidades Principales

- Registro e inicio de sesión de usuarios
- Control de sesión para páginas privadas
- Creación y gestión de cuentas bancarias
- Depósito de fondos
- Transferencias entre usuarios
- Agenda de destinatarios
- Generación de comprobantes
- Historial de movimientos
- Persistencia de datos por usuario
- Interfaz responsive

---

## 🛠️ Tecnologías Utilizadas

- **HTML5** – Estructura y semántica
- **CSS3** – Estilos personalizados
- **Bootstrap 5** (CDN) – Diseño responsive
- **JavaScript** – Lógica de la aplicación
- **jQuery** (CDN) – Manipulación del DOM
- **localStorage** – Persistencia de datos en el navegador

---

## 📁 Estructura del Proyecto

📦alke-wallet
 ┣ 📂css
 ┃ ┗ 📜styles.css
 ┣ 📂js
 ┃ ┗ 📜main.js
 ┣ 📜accounts.html
 ┣ 📜agenda.html
 ┣ 📜deposit.html
 ┣ 📜index.html
 ┣ 📜login.html
 ┣ 📜menu.html
 ┣ 📜receipt.html
 ┣ 📜register.html
 ┣ 📜sendmoney.html
 ┗ 📜transactions.html


---

## ▶️ Uso de la Aplicación

1. Abrir `index.html` en el navegador.
2. Iniciar sesión o registrar un nuevo usuario.
3. Crear una cuenta bancaria.
4. Depositar fondos.
5. Agregar destinatarios a la agenda.
6. Realizar transferencias.
7. Revisar comprobantes e historial de movimientos.

> ℹ️ Los datos se almacenan en **localStorage**.  
> Al limpiar los datos del navegador, toda la información se pierde.

---

## 🔐 Credenciales de Prueba

| Campo | Valor |
|------|------|
| Usuario | `admin@gmail.com` |
| Contraseña | `wallet1234` |

> ⚠️ Credenciales solo para fines demostrativos.

---

## 💾 Persistencia de Datos

La aplicación utiliza **localStorage** para almacenar información estructurada.

### Datos Globales
- Usuarios registrados

### Datos por Usuario
- Cuentas bancarias
- Contactos (agenda)
- Depósitos
- Transferencias enviadas
- Transferencias recibidas
- Historial de movimientos

---

## 🔄 Flujo General de Operaciones

### Depósito

Usuario → Depósito
↓
Saldo de cuenta incrementa
↓
Movimiento registrado en historial


### Transferencia

Usuario A → Transfiere a Usuario B
↓
Saldo A disminuye
↓
Saldo B incrementa
↓
Movimiento registrado para ambos usuarios


---

## ⚠️ Limitaciones

- No existe backend ni base de datos real
- No hay concurrencia real entre usuarios
- No se implementan transacciones atómicas
- `localStorage` no garantiza seguridad ni persistencia permanente
- Proyecto orientado exclusivamente a fines educativos

---

## 📱 Diseño Responsive

La interfaz es compatible con dispositivos móviles, tablets y desktop gracias al uso de Bootstrap.

---

## 📝 Licencia

Proyecto de uso educativo y libre.

---

## 👤 Autor

**Oscar Soto Mejías**  
Proyecto desarrollado como parte del programa de formación en Desarrollo Front-End – Módulo 2.

© 2025
