// ========================================
// ALKE WALLET - BILLETERA DIGITAL
// Módulo 2: Fundamentos del Desarrollo Frontend
// ========================================
// Este código usa JavaScript básico con jQuery
// Nivel: Alumno aplicado del Módulo 2
// ========================================

// ----------------------------------------
// CONFIGURACIÓN INICIAL
// ----------------------------------------

// Cuenta de prueba para testing
var TEST_ACCOUNT = {
    email: "admin@gmail.com",
    password: "wallet1234",
    nombre: "Administrador"
};

// Tiempo de vida de transferencias pendientes (24 horas en milisegundos)
var TRANSFER_TTL_HOURS = 24;
var TRANSFER_TTL_MS = TRANSFER_TTL_HOURS * 60 * 60 * 1000;

// Estados posibles de una transferencia
var ESTADO_ACREDITADA = "ACREDITADA";
var ESTADO_EN_PROCESO = "EN_PROCESO";
var ESTADO_RECHAZADA = "RECHAZADA";
var ESTADO_CANCELADA = "CANCELADA";

// ----------------------------------------
// FUNCIONES DE UTILIDAD
// ----------------------------------------

// Formatea un número como moneda chilena: 1000 -> "$1.000"
function formatCurrency(amount) {
    var numero = Math.round(amount);
    return "$" + numero.toLocaleString("es-CL");
}

// Formatea una fecha al formato chileno con hora
function formatDate(date) {
    var fecha = new Date(date);
    var opciones = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    };
    return fecha.toLocaleDateString("es-CL", opciones);
}

// Genera un ID único para transferencias (TRF-XXXXXXX-XXXX)
function generateTransferId() {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return "TRF-" + timestamp + "-" + random;
}

// Genera un ID único genérico
function generateUniqueId() {
    var timestamp = Date.now().toString(36);
    var random = Math.random().toString(36).substring(2, 8);
    return (timestamp + random).toUpperCase();
}

// Valida si un email tiene formato correcto
function isValidEmail(email) {
    var patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patron.test(email);
}

// Verifica si un string contiene solo números
function isNumeric(str) {
    var patron = /^\d+$/;
    return patron.test(str);
}

// Obtiene la clave de localStorage para el usuario actual
function getUserKey(key) {
    var currentUser = localStorage.getItem("currentUser");
    return "user_" + currentUser + "_" + key;
}

// Genera una clave única para identificar una cuenta bancaria
function getAccountKey(banco, tipoCuenta, numeroCuenta) {
    var clave = banco + "|" + tipoCuenta + "|" + numeroCuenta;
    return clave.toUpperCase();
}

// ----------------------------------------
// CONTROL DE SESIÓN
// ----------------------------------------

// Verifica si el usuario tiene sesión activa
function requireAuth() {
    var isLoggedIn = localStorage.getItem("isLoggedIn");
    var currentUser = localStorage.getItem("currentUser");
    
    if (isLoggedIn !== "true" || !currentUser) {
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
        return false;
    }
    return true;
}

// Alias para compatibilidad
function checkAuth() {
    return requireAuth();
}

// Cierra la sesión del usuario
function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastTransaction");
    window.location.href = "login.html";
}

// ----------------------------------------
// GESTIÓN DE USUARIOS
// ----------------------------------------

// Obtiene la lista de usuarios registrados
function getUsers() {
    var usersJson = localStorage.getItem("registeredUsers");
    if (usersJson) {
        return JSON.parse(usersJson);
    }
    return [];
}

// Guarda la lista de usuarios
function setUsers(users) {
    localStorage.setItem("registeredUsers", JSON.stringify(users));
}

// Busca un usuario por email
function findUser(email) {
    var emailLower = email.toLowerCase();
    
    // Verificar cuenta de prueba
    if (emailLower === TEST_ACCOUNT.email.toLowerCase()) {
        return TEST_ACCOUNT;
    }
    
    // Buscar en usuarios registrados
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
        if (users[i].email.toLowerCase() === emailLower) {
            return users[i];
        }
    }
    return null;
}

// Registra un nuevo usuario
function registerUser(userData) {
    var email = userData.email;
    var password = userData.password;
    var nombre = userData.nombre;
    
    // Verificar si ya existe
    if (findUser(email)) {
        return {
            success: false,
            message: "Este correo electrónico ya está registrado"
        };
    }
    
    // Crear nuevo usuario
    var newUser = {
        email: email.toLowerCase(),
        password: password,
        nombre: nombre,
        fechaRegistro: new Date().toISOString()
    };
    
    // Agregar a la lista
    var users = getUsers();
    users.push(newUser);
    setUsers(users);
    
    // Inicializar datos del usuario
    var emailKey = email.toLowerCase();
    localStorage.setItem("user_" + emailKey + "_accounts", JSON.stringify([]));
    localStorage.setItem("user_" + emailKey + "_contacts", JSON.stringify([]));
    localStorage.setItem("user_" + emailKey + "_transactions", JSON.stringify([]));
    localStorage.setItem("user_" + emailKey + "_deposits", JSON.stringify([]));
    localStorage.setItem("user_" + emailKey + "_receivedTransfers", JSON.stringify([]));
    
    return {
        success: true,
        message: "Usuario registrado exitosamente"
    };
}

// Autentica un usuario
function authenticateUser(email, password) {
    var emailLower = email.toLowerCase();
    
    // Verificar cuenta de prueba
    if (emailLower === TEST_ACCOUNT.email.toLowerCase()) {
        if (password === TEST_ACCOUNT.password) {
            initializeUserDataIfNeeded(TEST_ACCOUNT.email);
            return {
                success: true,
                message: "Login exitoso",
                user: TEST_ACCOUNT
            };
        }
        return {
            success: false,
            message: "Contraseña incorrecta",
            user: null
        };
    }
    
    // Buscar usuario registrado
    var user = findUser(email);
    
    if (!user) {
        return {
            success: false,
            message: "Usuario no encontrado",
            user: null
        };
    }
    
    if (user.password !== password) {
        return {
            success: false,
            message: "Contraseña incorrecta",
            user: null
        };
    }
    
    return {
        success: true,
        message: "Login exitoso",
        user: user
    };
}

// Inicializa datos de usuario si no existen
function initializeUserDataIfNeeded(email) {
    var emailLower = email.toLowerCase();
    var accountsKey = "user_" + emailLower + "_accounts";
    
    if (localStorage.getItem(accountsKey) === null) {
        localStorage.setItem(accountsKey, JSON.stringify([]));
        localStorage.setItem("user_" + emailLower + "_contacts", JSON.stringify([]));
        localStorage.setItem("user_" + emailLower + "_transactions", JSON.stringify([]));
        localStorage.setItem("user_" + emailLower + "_deposits", JSON.stringify([]));
        localStorage.setItem("user_" + emailLower + "_receivedTransfers", JSON.stringify([]));
    }
}

// ----------------------------------------
// BÚSQUEDA GLOBAL DE CUENTAS
// ----------------------------------------

// Busca una cuenta bancaria en todo el sistema
function findAccountInSystem(banco, tipoCuenta, numeroCuenta) {
    var targetKey = getAccountKey(banco, tipoCuenta, numeroCuenta);
    
    // Buscar en cuenta de prueba
    var testAccountsJson = localStorage.getItem("user_" + TEST_ACCOUNT.email.toLowerCase() + "_accounts");
    var testAccounts = [];
    if (testAccountsJson) {
        testAccounts = JSON.parse(testAccountsJson);
    }
    
    for (var i = 0; i < testAccounts.length; i++) {
        var acc = testAccounts[i];
        var accKey = getAccountKey(acc.banco, acc.tipoCuenta, acc.numeroCuenta);
        if (accKey === targetKey) {
            return {
                userEmail: TEST_ACCOUNT.email.toLowerCase(),
                account: acc
            };
        }
    }
    
    // Buscar en todos los usuarios
    var users = getUsers();
    for (var j = 0; j < users.length; j++) {
        var user = users[j];
        var userAccountsJson = localStorage.getItem("user_" + user.email + "_accounts");
        var userAccounts = [];
        if (userAccountsJson) {
            userAccounts = JSON.parse(userAccountsJson);
        }
        
        for (var k = 0; k < userAccounts.length; k++) {
            var userAcc = userAccounts[k];
            var userAccKey = getAccountKey(userAcc.banco, userAcc.tipoCuenta, userAcc.numeroCuenta);
            if (userAccKey === targetKey) {
                return {
                    userEmail: user.email,
                    account: userAcc
                };
            }
        }
    }
    
    return null;
}

// Acredita un monto a una cuenta
function creditToAccount(userEmail, accountId, amount) {
    var accountsKey = "user_" + userEmail + "_accounts";
    var accountsJson = localStorage.getItem(accountsKey);
    var accounts = [];
    if (accountsJson) {
        accounts = JSON.parse(accountsJson);
    }
    
    for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].id === accountId) {
            accounts[i].saldo = accounts[i].saldo + amount;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return true;
        }
    }
    return false;
}

// Debita un monto de una cuenta
function debitFromAccount(userEmail, accountId, amount) {
    var accountsKey = "user_" + userEmail + "_accounts";
    var accountsJson = localStorage.getItem(accountsKey);
    var accounts = [];
    if (accountsJson) {
        accounts = JSON.parse(accountsJson);
    }
    
    for (var i = 0; i < accounts.length; i++) {
        if (accounts[i].id === accountId && accounts[i].saldo >= amount) {
            accounts[i].saldo = accounts[i].saldo - amount;
            localStorage.setItem(accountsKey, JSON.stringify(accounts));
            return true;
        }
    }
    return false;
}

// ----------------------------------------
// TRANSFERENCIAS PENDIENTES
// ----------------------------------------

// Obtiene transferencias pendientes
function getPendingTransfers() {
    var pendingJson = localStorage.getItem("pendingTransfers");
    if (pendingJson) {
        return JSON.parse(pendingJson);
    }
    return [];
}

// Guarda transferencias pendientes
function setPendingTransfers(transfers) {
    localStorage.setItem("pendingTransfers", JSON.stringify(transfers));
}

// Agrega una transferencia pendiente
function addPendingTransfer(transfer) {
    var pending = getPendingTransfers();
    var fechaExpiracion = new Date(Date.now() + TRANSFER_TTL_MS);
    transfer.expiraEn = fechaExpiracion.toISOString();
    pending.push(transfer);
    setPendingTransfers(pending);
}

// Busca transferencias pendientes para una cuenta
function findPendingTransfersForAccount(banco, tipoCuenta, numeroCuenta) {
    var targetKey = getAccountKey(banco, tipoCuenta, numeroCuenta);
    var pending = getPendingTransfers();
    var now = new Date();
    var resultado = [];
    
    for (var i = 0; i < pending.length; i++) {
        var t = pending[i];
        var tKey = getAccountKey(t.destinatario.banco, t.destinatario.tipoCuenta, t.destinatario.numeroCuenta);
        var fechaExpira = new Date(t.expiraEn);
        
        if (tKey === targetKey && fechaExpira > now) {
            resultado.push(t);
        }
    }
    return resultado;
}

// Elimina transferencias pendientes por IDs
function removePendingTransfers(transferIds) {
    var pending = getPendingTransfers();
    var updated = [];
    
    for (var i = 0; i < pending.length; i++) {
        var encontrado = false;
        for (var j = 0; j < transferIds.length; j++) {
            if (pending[i].transferId === transferIds[j]) {
                encontrado = true;
                break;
            }
        }
        if (!encontrado) {
            updated.push(pending[i]);
        }
    }
    setPendingTransfers(updated);
}

// Busca una transferencia pendiente por ID
function findPendingByTransferId(transferId) {
    var pending = getPendingTransfers();
    for (var i = 0; i < pending.length; i++) {
        if (pending[i].transferId === transferId) {
            return pending[i];
        }
    }
    return null;
}

// Procesa transferencias expiradas
function processExpiredTransfers() {
    var pending = getPendingTransfers();
    var now = new Date();
    var expired = [];
    var valid = [];
    
    // Separar expiradas de válidas
    for (var i = 0; i < pending.length; i++) {
        var fechaExpira = new Date(pending[i].expiraEn);
        if (fechaExpira <= now) {
            expired.push(pending[i]);
        } else {
            valid.push(pending[i]);
        }
    }
    
    // Procesar expiradas
    for (var j = 0; j < expired.length; j++) {
        var t = expired[j];
        
        // Devolver fondos
        creditToAccount(t.remitenteEmail, t.cuentaOrigen.id, t.monto);
        
        // Actualizar estado a RECHAZADA
        updateTransactionStatus(
            t.remitenteEmail,
            t.transferId,
            ESTADO_RECHAZADA,
            "Expirada por TTL (24h sin acreditación)"
        );
    }
    
    setPendingTransfers(valid);
    return expired.length;
}

// Actualiza estado de una transacción
function updateTransactionStatus(userEmail, transferId, nuevoEstado, motivo) {
    var txKey = "user_" + userEmail + "_transactions";
    var transactionsJson = localStorage.getItem(txKey);
    var transactions = [];
    if (transactionsJson) {
        transactions = JSON.parse(transactionsJson);
    }
    
    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].transferId === transferId) {
            transactions[i].estadoAcreditacion = nuevoEstado;
            transactions[i].motivoCambioEstado = motivo || "";
            transactions[i].fechaCambioEstado = new Date().toISOString();
            localStorage.setItem(txKey, JSON.stringify(transactions));
            return true;
        }
    }
    return false;
}

// Obtiene sugerencias para una cuenta
function getSuggestedDataForAccount(banco, tipoCuenta, numeroCuenta) {
    var pendingTransfers = findPendingTransfersForAccount(banco, tipoCuenta, numeroCuenta);
    
    if (pendingTransfers.length === 0) {
        return null;
    }
    
    var suggestions = {
        nombres: [],
        ruts: [],
        totalPendiente: 0,
        cantidadTransferencias: pendingTransfers.length,
        transferencias: pendingTransfers
    };
    
    for (var i = 0; i < pendingTransfers.length; i++) {
        var t = pendingTransfers[i];
        
        // Agregar nombre si no está repetido
        if (t.destinatario.nombre) {
            var nombreExiste = false;
            for (var j = 0; j < suggestions.nombres.length; j++) {
                if (suggestions.nombres[j] === t.destinatario.nombre) {
                    nombreExiste = true;
                    break;
                }
            }
            if (!nombreExiste) {
                suggestions.nombres.push(t.destinatario.nombre);
            }
        }
        
        // Agregar RUT si no está repetido
        if (t.destinatario.rut) {
            var rutExiste = false;
            for (var k = 0; k < suggestions.ruts.length; k++) {
                if (suggestions.ruts[k] === t.destinatario.rut) {
                    rutExiste = true;
                    break;
                }
            }
            if (!rutExiste) {
                suggestions.ruts.push(t.destinatario.rut);
            }
        }
        
        suggestions.totalPendiente = suggestions.totalPendiente + t.monto;
    }
    
    return suggestions;
}

// ----------------------------------------
// DATOS DEL USUARIO ACTUAL
// ----------------------------------------

// Obtiene cuentas del usuario
function getAccounts() {
    var accountsJson = localStorage.getItem(getUserKey("accounts"));
    if (accountsJson) {
        return JSON.parse(accountsJson);
    }
    return [];
}

// Guarda cuentas del usuario
function setAccounts(accounts) {
    localStorage.setItem(getUserKey("accounts"), JSON.stringify(accounts));
}

// Calcula saldo total
function getTotalBalance() {
    var accounts = getAccounts();
    var total = 0;
    for (var i = 0; i < accounts.length; i++) {
        total = total + accounts[i].saldo;
    }
    return total;
}

// Obtiene contactos del usuario
function getContacts() {
    var contactsJson = localStorage.getItem(getUserKey("contacts"));
    if (contactsJson) {
        return JSON.parse(contactsJson);
    }
    return [];
}

// Guarda contactos
function setContacts(contacts) {
    localStorage.setItem(getUserKey("contacts"), JSON.stringify(contacts));
}

// Obtiene transacciones
function getTransactions() {
    var transactionsJson = localStorage.getItem(getUserKey("transactions"));
    if (transactionsJson) {
        return JSON.parse(transactionsJson);
    }
    return [];
}

// Guarda transacciones
function setTransactions(transactions) {
    localStorage.setItem(getUserKey("transactions"), JSON.stringify(transactions));
}

// Obtiene depósitos
function getDeposits() {
    var depositsJson = localStorage.getItem(getUserKey("deposits"));
    if (depositsJson) {
        return JSON.parse(depositsJson);
    }
    return [];
}

// Guarda depósitos
function setDeposits(deposits) {
    localStorage.setItem(getUserKey("deposits"), JSON.stringify(deposits));
}

// Obtiene transferencias recibidas
function getReceivedTransfers() {
    var receivedJson = localStorage.getItem(getUserKey("receivedTransfers"));
    if (receivedJson) {
        return JSON.parse(receivedJson);
    }
    return [];
}

// Guarda transferencias recibidas
function setReceivedTransfers(transfers) {
    localStorage.setItem(getUserKey("receivedTransfers"), JSON.stringify(transfers));
}

// Guarda última transacción
function setLastTransaction(transaction) {
    localStorage.setItem("lastTransaction", JSON.stringify(transaction));
}

// Obtiene última transacción
function getLastTransaction() {
    var txJson = localStorage.getItem("lastTransaction");
    if (txJson) {
        return JSON.parse(txJson);
    }
    return null;
}

// Obtiene nombre del usuario actual
function getCurrentUserName() {
    var email = localStorage.getItem("currentUser");
    
    if (email && email.toLowerCase() === TEST_ACCOUNT.email.toLowerCase()) {
        return TEST_ACCOUNT.nombre;
    }
    
    var user = findUser(email);
    if (user) {
        return user.nombre;
    }
    return email;
}

// Obtiene email del usuario actual
function getCurrentUserEmail() {
    return localStorage.getItem("currentUser");
}

// ----------------------------------------
// CANCELACIÓN DE TRANSFERENCIAS
// ----------------------------------------

function cancelTransfer(transferId) {
    var currentUser = getCurrentUserEmail();
    var transactions = getTransactions();
    
    // Buscar la transacción
    var tx = null;
    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i].transferId === transferId) {
            tx = transactions[i];
            break;
        }
    }
    
    if (!tx) {
        return {
            success: false,
            message: "Transferencia no encontrada"
        };
    }
    
    if (tx.estadoAcreditacion !== ESTADO_EN_PROCESO) {
        return {
            success: false,
            message: "No se puede cancelar una transferencia con estado " + tx.estadoAcreditacion
        };
    }
    
    var pendingTx = findPendingByTransferId(transferId);
    if (!pendingTx) {
        return {
            success: false,
            message: "La transferencia ya no está pendiente"
        };
    }
    
    // Devolver fondos
    var accounts = getAccounts();
    var origenAccount = null;
    
    for (var j = 0; j < accounts.length; j++) {
        if (accounts[j].id === tx.cuentaOrigen.id) {
            origenAccount = accounts[j];
            break;
        }
    }
    
    if (origenAccount) {
        origenAccount.saldo = origenAccount.saldo + tx.monto;
        setAccounts(accounts);
    } else {
        return {
            success: false,
            message: "Cuenta origen no encontrada para reembolso"
        };
    }
    
    // Actualizar estado
    tx.estadoAcreditacion = ESTADO_CANCELADA;
    tx.motivoCambioEstado = "Cancelada por el usuario";
    tx.fechaCambioEstado = new Date().toISOString();
    setTransactions(transactions);
    
    // Eliminar de pendientes
    removePendingTransfers([transferId]);
    
    return {
        success: true,
        message: "Transferencia cancelada. Se han devuelto " + formatCurrency(tx.monto) + " a tu cuenta."
    };
}

// ----------------------------------------
// FUNCIÓN AUXILIAR: Badge según estado
// ----------------------------------------

function getBadgeForStatus(estado) {
    if (estado === ESTADO_ACREDITADA) {
        return '<span class="badge bg-success">ACREDITADA</span>';
    } else if (estado === ESTADO_EN_PROCESO) {
        return '<span class="badge bg-warning text-dark">EN PROCESO</span>';
    } else if (estado === ESTADO_RECHAZADA) {
        return '<span class="badge bg-danger">RECHAZADA</span>';
    } else if (estado === ESTADO_CANCELADA) {
        return '<span class="badge bg-secondary">CANCELADA</span>';
    } else {
        return '<span class="badge bg-dark">ENVIADA</span>';
    }
}

// ----------------------------------------
// PÁGINA: REGISTRO
// ----------------------------------------

function initRegister() {
    // Si ya está logueado, redirigir
    if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "menu.html";
        return;
    }
    
    // Manejar formulario con jQuery
    $("#registerForm").on("submit", function(e) {
        e.preventDefault();
        
        // Ocultar mensajes
        $("#errorMessage").addClass("d-none");
        $("#successMessage").addClass("d-none");
        
        // Obtener valores
        var nombre = $("#nombre").val().trim();
        var email = $("#email").val().trim();
        var password = $("#password").val();
        var confirmPassword = $("#confirmPassword").val();
        
        // Validaciones
        if (!nombre || !email || !password) {
            $("#errorMessage").text("Error: Complete todos los campos obligatorios").removeClass("d-none");
            return;
        }
        
        if (!isValidEmail(email)) {
            $("#errorMessage").text("Error: Ingrese un email válido").removeClass("d-none");
            return;
        }
        
        if (password.length < 6) {
            $("#errorMessage").text("Error: La contraseña debe tener al menos 6 caracteres").removeClass("d-none");
            return;
        }
        
        if (password !== confirmPassword) {
            $("#errorMessage").text("Error: Las contraseñas no coinciden").removeClass("d-none");
            return;
        }
        
        // Registrar
        var result = registerUser({
            email: email,
            password: password,
            nombre: nombre
        });
        
        if (!result.success) {
            $("#errorMessage").text("Error: " + result.message).removeClass("d-none");
            return;
        }
        
        // Éxito
        $("#successMessage").html("<strong>¡Éxito!</strong> Cuenta creada. Ahora deberás crear tu primera cuenta bancaria para operar.").removeClass("d-none");
        $("#btnRegister").html('<span class="spinner-border spinner-border-sm me-2"></span>Redirigiendo...').prop("disabled", true);
        
        setTimeout(function() {
            window.location.href = "login.html";
        }, 2500);
    });
    
    $("#nombre").focus();
}

// ----------------------------------------
// PÁGINA: LOGIN
// ----------------------------------------

function initLogin() {
    if (localStorage.getItem("isLoggedIn") === "true") {
        window.location.href = "menu.html";
        return;
    }
    
    $("#loginForm").on("submit", function(e) {
        e.preventDefault();
        
        $("#errorMessage").addClass("d-none");
        
        var email = $("#email").val().trim();
        var password = $("#password").val();
        
        var result = authenticateUser(email, password);
        
        if (result.success) {
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("currentUser", email.toLowerCase());
            
            $("#btnLogin").html('<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...').prop("disabled", true);
            
            setTimeout(function() {
                window.location.href = "menu.html";
            }, 1000);
        } else {
            $("#errorMessage").text("Error: " + result.message).removeClass("d-none");
            $("#password").val("").focus();
            
            $("#loginForm").addClass("shake");
            setTimeout(function() {
                $("#loginForm").removeClass("shake");
            }, 500);
        }
    });
    
    $("#email").focus();
}

// ----------------------------------------
// PÁGINA: HOME
// ----------------------------------------

function initHome() {
    if (!requireAuth()) {
        return;
    }
    
    // Procesar transferencias expiradas
    var expiredCount = processExpiredTransfers();
    if (expiredCount > 0) {
        console.log("Se procesaron " + expiredCount + " transferencias expiradas");
    }
    
    // Configurar logout
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    // Mostrar saludo
    var userName = getCurrentUserName();
    var currentEmail = getCurrentUserEmail();
    $("#welcomeMessage").html("Bienvenido, <strong>" + userName + "</strong> <small class='text-muted'>(" + currentEmail + ")</small>");
    
    // Mostrar saldo total
    var accounts = getAccounts();
    var totalBalance = getTotalBalance();
    $("#totalBalance").text(formatCurrency(totalBalance));
    
    // Resumen de cuentas
    var cuentasTexto = accounts.length + " cuenta";
    if (accounts.length !== 1) {
        cuentasTexto += "s";
    }
    cuentasTexto += " registrada";
    if (accounts.length !== 1) {
        cuentasTexto += "s";
    }
    $("#accountsSummary").text(cuentasTexto);
    
    // Alerta si no tiene cuentas
    if (accounts.length === 0) {
        $("#noAccountsAlert").removeClass("d-none");
    }
    
    // Obtener movimientos
    var transactions = getTransactions();
    var deposits = getDeposits();
    var received = getReceivedTransfers();
    
    // Combinar movimientos
    var allMovements = [];
    
    for (var i = 0; i < transactions.length; i++) {
        var txCopy = JSON.parse(JSON.stringify(transactions[i]));
        txCopy.tipoMovimiento = "TRANSFERENCIA_ENVIADA";
        allMovements.push(txCopy);
    }
    
    for (var j = 0; j < deposits.length; j++) {
        var depCopy = JSON.parse(JSON.stringify(deposits[j]));
        depCopy.tipoMovimiento = "DEPOSITO";
        allMovements.push(depCopy);
    }
    
    for (var k = 0; k < received.length; k++) {
        var recCopy = JSON.parse(JSON.stringify(received[k]));
        recCopy.tipoMovimiento = "TRANSFERENCIA_RECIBIDA";
        allMovements.push(recCopy);
    }
    
    // Ordenar por fecha
    allMovements.sort(function(a, b) {
        return new Date(b.fechaHora) - new Date(a.fechaHora);
    });
    
    // Renderizar últimos 5 movimientos
    var $tbody = $("#recentTransactions");
    $tbody.empty();
    
    if (allMovements.length === 0) {
        $tbody.html('<tr><td colspan="4" class="text-center text-muted py-4">No hay movimientos recientes</td></tr>');
    } else {
        var limit = 5;
        if (allMovements.length < 5) {
            limit = allMovements.length;
        }
        
        for (var m = 0; m < limit; m++) {
            var mov = allMovements[m];
            var descripcion = "";
            var montoClass = "";
            var montoPrefix = "";
            var badge = "";
            var rowClass = "";
            
            if (mov.tipoMovimiento === "DEPOSITO") {
                if (mov.origen && mov.origen.nombre) {
                    descripcion = mov.origen.nombre;
                } else {
                    descripcion = "Depósito";
                }
                montoClass = "text-success";
                montoPrefix = "+";
                badge = '<span class="badge bg-success">DEPÓSITO</span>';
                rowClass = "table-success";
            } else if (mov.tipoMovimiento === "TRANSFERENCIA_RECIBIDA") {
                if (mov.remitente && mov.remitente.nombre) {
                    descripcion = mov.remitente.nombre;
                } else {
                    descripcion = "Transferencia recibida";
                }
                montoClass = "text-success";
                montoPrefix = "+";
                badge = '<span class="badge bg-info">RECIBIDA</span>';
                rowClass = "table-success";
            } else {
                if (mov.destinatario && mov.destinatario.nombre) {
                    descripcion = mov.destinatario.nombre;
                } else {
                    descripcion = "Transferencia";
                }
                montoClass = "text-danger";
                montoPrefix = "-";
                badge = getBadgeForStatus(mov.estadoAcreditacion);
                rowClass = "";
            }
            
            var html = '<tr class="' + rowClass + '">';
            html += '<td>' + formatDate(mov.fechaHora) + '</td>';
            html += '<td>' + descripcion + '</td>';
            html += '<td class="' + montoClass + ' fw-bold">' + montoPrefix + formatCurrency(mov.monto) + '</td>';
            html += '<td>' + badge + '</td>';
            html += '</tr>';
            
            $tbody.append(html);
        }
    }
}

// ----------------------------------------
// PÁGINA: MIS CUENTAS
// ----------------------------------------

function initAccounts() {
    if (!requireAuth()) {
        return;
    }
    
    processExpiredTransfers();
    
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    renderAccounts();
    
    // Verificar sugerencias
    $("#accountBanco, #accountTipo, #accountNumero").on("change blur", checkForSuggestions);
    
    // Formulario
    $("#accountForm").on("submit", function(e) {
        e.preventDefault();
        
        $("#accountError").addClass("d-none");
        $("#accountSuccess").addClass("d-none");
        
        var alias = $("#accountAlias").val().trim();
        var banco = $("#accountBanco").val();
        var tipoCuenta = $("#accountTipo").val();
        var numeroCuenta = $("#accountNumero").val().trim();
        var saldo = parseFloat($("#accountSaldo").val()) || 0;
        
        // Validaciones
        if (!alias || !banco || !tipoCuenta || !numeroCuenta) {
            $("#accountError").text("Error: Complete todos los campos obligatorios").removeClass("d-none");
            return;
        }
        
        if (!isNumeric(numeroCuenta)) {
            $("#accountError").text("Error: El número de cuenta debe contener solo números").removeClass("d-none");
            return;
        }
        
        var currentUser = getCurrentUserEmail();
        var existingAccount = findAccountInSystem(banco, tipoCuenta, numeroCuenta);
        
        if (existingAccount && existingAccount.userEmail !== currentUser) {
            $("#accountError").text("Error: Esta cuenta bancaria ya está registrada por otro usuario en el sistema").removeClass("d-none");
            return;
        }
        
        // Verificar si ya tengo esta cuenta
        var myAccounts = getAccounts();
        var alreadyHave = false;
        
        for (var i = 0; i < myAccounts.length; i++) {
            var accKey = getAccountKey(myAccounts[i].banco, myAccounts[i].tipoCuenta, myAccounts[i].numeroCuenta);
            var newAccKey = getAccountKey(banco, tipoCuenta, numeroCuenta);
            if (accKey === newAccKey) {
                alreadyHave = true;
                break;
            }
        }
        
        if (alreadyHave) {
            $("#accountError").text("Error: Ya tienes esta cuenta registrada").removeClass("d-none");
            return;
        }
        
        // Buscar transferencias pendientes
        var pendingForThis = findPendingTransfersForAccount(banco, tipoCuenta, numeroCuenta);
        var totalPendiente = 0;
        var pendingIds = [];
        
        // Crear cuenta
        var newAccount = {
            id: generateUniqueId(),
            alias: alias,
            banco: banco,
            tipoCuenta: tipoCuenta,
            numeroCuenta: numeroCuenta,
            saldo: saldo
        };
        
        // CONCILIACIÓN
        if (pendingForThis.length > 0) {
            var received = getReceivedTransfers();
            
            for (var j = 0; j < pendingForThis.length; j++) {
                var t = pendingForThis[j];
                totalPendiente = totalPendiente + t.monto;
                pendingIds.push(t.transferId);
                
                newAccount.saldo = newAccount.saldo + t.monto;
                
                var receivedTx = {
                    transferId: t.transferId,
                    fechaHora: t.fechaHora,
                    fechaAcreditacion: new Date().toISOString(),
                    remitente: {
                        nombre: t.remitenteNombre,
                        email: t.remitenteEmail,
                        banco: t.cuentaOrigen ? t.cuentaOrigen.banco : "N/A"
                    },
                    cuentaDestino: {
                        id: newAccount.id,
                        alias: newAccount.alias,
                        banco: newAccount.banco
                    },
                    monto: t.monto,
                    mensaje: t.mensaje,
                    estado: ESTADO_ACREDITADA
                };
                received.unshift(receivedTx);
                
                updateTransactionStatus(
                    t.remitenteEmail,
                    t.transferId,
                    ESTADO_ACREDITADA,
                    "Cuenta destino creada - Fondos acreditados"
                );
            }
            
            setReceivedTransfers(received);
            removePendingTransfers(pendingIds);
        }
        
        myAccounts.push(newAccount);
        setAccounts(myAccounts);
        
        // Mensaje de éxito
        var successMsg = "<strong>¡Éxito!</strong> Cuenta bancaria creada correctamente.";
        if (totalPendiente > 0) {
            successMsg += '<br><span class="text-success">Se han acreditado ' + formatCurrency(totalPendiente) + ' de ' + pendingForThis.length + ' transferencia(s) pendiente(s).</span>';
        }
        $("#accountSuccess").html(successMsg).removeClass("d-none");
        
        $("#accountForm")[0].reset();
        $("#suggestionsAlert").addClass("d-none");
        
        renderAccounts();
    });
}

// Verificar sugerencias
function checkForSuggestions() {
    var banco = $("#accountBanco").val();
    var tipoCuenta = $("#accountTipo").val();
    var numeroCuenta = $("#accountNumero").val().trim();
    
    if (!banco || !tipoCuenta || !numeroCuenta || !isNumeric(numeroCuenta)) {
        $("#suggestionsAlert").addClass("d-none");
        return;
    }
    
    var currentUser = getCurrentUserEmail();
    var existing = findAccountInSystem(banco, tipoCuenta, numeroCuenta);
    
    if (existing && existing.userEmail !== currentUser) {
        $("#suggestionsAlert").html('<strong class="text-danger">⚠️ Esta cuenta ya existe en el sistema</strong><br><small>No podrás crearla porque pertenece a otro usuario.</small>').removeClass("d-none");
        return;
    }
    
    var suggestions = getSuggestedDataForAccount(banco, tipoCuenta, numeroCuenta);
    
    if (suggestions && suggestions.cantidadTransferencias > 0) {
        var html = "<strong>📥 Hay " + suggestions.cantidadTransferencias + " transferencia(s) pendiente(s) para esta cuenta</strong>";
        html += '<br>Total a acreditar: <strong class="text-success">' + formatCurrency(suggestions.totalPendiente) + '</strong>';
        
        if (suggestions.nombres.length > 0) {
            html += "<br><small>Nombre(s) registrado(s) por remitentes: <em>" + suggestions.nombres.join(", ") + "</em></small>";
        }
        
        if (suggestions.ruts.length > 0) {
            html += "<br><small>RUT(s) registrado(s): <em>" + suggestions.ruts.join(", ") + "</em></small>";
        }
        
        html += '<br><small class="text-muted">Al crear esta cuenta, se acreditarán automáticamente estos fondos.</small>';
        
        $("#suggestionsAlert").html(html).removeClass("d-none");
    } else {
        $("#suggestionsAlert").addClass("d-none");
    }
}

// Renderizar tabla de cuentas
function renderAccounts() {
    var accounts = getAccounts();
    var $tbody = $("#accountsTable");
    $tbody.empty();
    
    $("#accountCount").text(accounts.length);
    $("#totalBalance").text(formatCurrency(getTotalBalance()));
    
    if (accounts.length === 0) {
        $tbody.html('<tr><td colspan="6" class="text-center text-muted py-4">No hay cuentas registradas. ¡Crea tu primera cuenta!</td></tr>');
    } else {
        for (var i = 0; i < accounts.length; i++) {
            var acc = accounts[i];
            var html = "<tr>";
            html += "<td><strong>" + acc.alias + "</strong></td>";
            html += "<td><small>" + acc.banco + "</small></td>";
            html += "<td>" + acc.tipoCuenta + "</td>";
            html += "<td><code>" + acc.numeroCuenta + "</code></td>";
            html += '<td class="fw-bold text-primary">' + formatCurrency(acc.saldo) + "</td>";
            html += '<td><button class="btn btn-sm btn-outline-danger btn-delete-account" data-id="' + acc.id + '">Eliminar</button></td>';
            html += "</tr>";
            $tbody.append(html);
        }
        
        // Configurar botones eliminar
        $(".btn-delete-account").off("click").on("click", function() {
            var accId = $(this).data("id");
            var accounts = getAccounts();
            var acc = null;
            
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id === accId) {
                    acc = accounts[i];
                    break;
                }
            }
            
            if (acc && acc.saldo > 0) {
                if (!confirm("Esta cuenta tiene saldo de " + formatCurrency(acc.saldo) + ". ¿Eliminar de todos modos? El saldo se perderá.")) {
                    return;
                }
            } else if (!confirm("¿Eliminar esta cuenta?")) {
                return;
            }
            
            var newAccounts = [];
            for (var j = 0; j < accounts.length; j++) {
                if (accounts[j].id !== accId) {
                    newAccounts.push(accounts[j]);
                }
            }
            
            setAccounts(newAccounts);
            renderAccounts();
            
            $("#accountSuccess").html("<strong>Cuenta eliminada</strong>").removeClass("d-none");
            setTimeout(function() {
                $("#accountSuccess").addClass("d-none");
            }, 3000);
        });
    }
}

// ----------------------------------------
// PÁGINA: AGENDA
// ----------------------------------------

function initAgenda() {
    if (!requireAuth()) {
        return;
    }
    
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    renderContacts();
    
    $("#contactForm").on("submit", function(e) {
        e.preventDefault();
        
        $("#formError").addClass("d-none");
        $("#formSuccess").addClass("d-none");
        
        var rut = $("#contactRut").val().trim();
        var nombre = $("#contactNombre").val().trim();
        var banco = $("#contactBanco").val();
        var tipoCuenta = $("#contactTipoCuenta").val();
        var numeroCuenta = $("#contactNumeroCuenta").val().trim();
        var email = $("#contactEmail").val().trim();
        
        if (!rut || !nombre || !banco || !tipoCuenta || !numeroCuenta) {
            $("#formError").text("Error: Complete todos los campos obligatorios").removeClass("d-none");
            return;
        }
        
        if (!isNumeric(numeroCuenta)) {
            $("#formError").text("Error: El número de cuenta debe contener solo números").removeClass("d-none");
            return;
        }
        
        if (email && !isValidEmail(email)) {
            $("#formError").text("Error: Ingrese un email válido").removeClass("d-none");
            return;
        }
        
        var newContact = {
            id: generateUniqueId(),
            rut: rut,
            nombre: nombre,
            banco: banco,
            tipoCuenta: tipoCuenta,
            numeroCuenta: numeroCuenta,
            email: email || ""
        };
        
        var contacts = getContacts();
        contacts.push(newContact);
        setContacts(contacts);
        
        $("#formSuccess").html("<strong>¡Éxito!</strong> Destinatario agregado correctamente").removeClass("d-none");
        $("#contactForm")[0].reset();
        renderContacts();
        
        setTimeout(function() {
            $("#formSuccess").addClass("d-none");
        }, 3000);
    });
}

// Renderizar contactos
function renderContacts() {
    var contacts = getContacts();
    var $tbody = $("#contactsTable");
    $tbody.empty();
    
    $("#contactCount").text(contacts.length);
    
    if (contacts.length === 0) {
        $tbody.html('<tr><td colspan="5" class="text-center text-muted py-4">No hay destinatarios registrados</td></tr>');
    } else {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            var existsInSystem = findAccountInSystem(c.banco, c.tipoCuenta, c.numeroCuenta);
            
            var statusBadge = "";
            if (existsInSystem) {
                statusBadge = '<span class="badge bg-success ms-1" title="Cuenta existe en el sistema">✓</span>';
            } else {
                statusBadge = '<span class="badge bg-secondary ms-1" title="Cuenta externa">ext</span>';
            }
            
            var html = "<tr>";
            html += "<td><strong>" + c.nombre + "</strong>" + statusBadge + "</td>";
            html += "<td>" + c.rut + "</td>";
            html += "<td><small>" + c.banco + "</small></td>";
            html += "<td>" + c.tipoCuenta + " - <code>" + c.numeroCuenta + "</code></td>";
            html += '<td><button class="btn btn-sm btn-outline-danger btn-delete-contact" data-id="' + c.id + '">Eliminar</button></td>';
            html += "</tr>";
            $tbody.append(html);
        }
        
        $(".btn-delete-contact").off("click").on("click", function() {
            if (confirm("¿Eliminar este destinatario?")) {
                var contactId = $(this).data("id");
                var contacts = getContacts();
                var newContacts = [];
                
                for (var i = 0; i < contacts.length; i++) {
                    if (contacts[i].id !== contactId) {
                        newContacts.push(contacts[i]);
                    }
                }
                
                setContacts(newContacts);
                renderContacts();
            }
        });
    }
}

// ----------------------------------------
// PÁGINA: DEPOSITAR
// ----------------------------------------

function initDeposit() {
    if (!requireAuth()) {
        return;
    }
    
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    loadAccountsForDeposit();
    
    $(".quick-amount").on("click", function() {
        var amount = $(this).data("amount");
        $("#monto").val(amount);
    });
    
    $("#cuentaDestino").on("change", function() {
        var accountId = $(this).val();
        
        if (accountId) {
            var accounts = getAccounts();
            var account = null;
            
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id === accountId) {
                    account = accounts[i];
                    break;
                }
            }
            
            if (account) {
                $("#destinoBanco").text(account.banco);
                $("#destinoSaldo").text(formatCurrency(account.saldo));
                $("#destinoInfo").removeClass("d-none");
            }
        } else {
            $("#destinoInfo").addClass("d-none");
        }
    });
    
    $("#depositForm").on("submit", function(e) {
        e.preventDefault();
        
        $("#depositError").addClass("d-none");
        $("#depositSuccess").addClass("d-none");
        
        var accountId = $("#cuentaDestino").val();
        var monto = parseFloat($("#monto").val());
        
        if (!accountId) {
            $("#depositError").text("Error: Seleccione una cuenta destino").removeClass("d-none");
            return;
        }
        
        if (!monto || monto <= 0) {
            $("#depositError").text("Error: Ingrese un monto válido mayor a 0").removeClass("d-none");
            return;
        }
        
        var accounts = getAccounts();
        var account = null;
        
        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].id === accountId) {
                account = accounts[i];
                break;
            }
        }
        
        if (!account) {
            $("#depositError").text("Error: Cuenta no encontrada").removeClass("d-none");
            return;
        }
        
        account.saldo = account.saldo + monto;
        setAccounts(accounts);
        // Crear registro de depósito
        var deposit = {
            id: generateUniqueId(),
            tipo: "DEPOSITO",
            fechaHora: new Date().toISOString(),
            origen: {
                nombre: "The World",
                email: "theworld@gmail.com",
                banco: "BANCO DEL ESTADO DE CHILE"
            },
            cuentaDestino: {
                id: account.id,
                alias: account.alias,
                banco: account.banco
            },
            monto: monto,
            estado: "SUCCESS"
        };
        
        var deposits = getDeposits();
        deposits.unshift(deposit);
        setDeposits(deposits);
        
        var $btn = $("#btnDeposit");
        var originalText = $btn.html();
        $btn.html('<span class="spinner-border spinner-border-sm me-2"></span>Procesando...').prop("disabled", true);
        
        setTimeout(function() {
            $btn.html(originalText).prop("disabled", false);
            $("#depositedAmount").text(formatCurrency(monto));
            $("#depositSuccess").html("<strong>¡Éxito!</strong> Se han depositado " + formatCurrency(monto) + ' en tu cuenta "' + account.alias + '".').removeClass("d-none");
            $("#destinoSaldo").text(formatCurrency(account.saldo));
            $("#monto").val("");
        }, 1000);
    });
}

// Cargar cuentas para depósito
function loadAccountsForDeposit() {
    var accounts = getAccounts();
    var $select = $("#cuentaDestino");
    
    $select.find("option:not(:first)").remove();
    
    if (accounts.length === 0) {
        $("#noAccountsAlert").removeClass("d-none");
        $("#depositForm").find('button[type="submit"]').prop("disabled", true);
    } else {
        for (var i = 0; i < accounts.length; i++) {
            var acc = accounts[i];
            var optionText = acc.alias + " - " + acc.banco + " (" + formatCurrency(acc.saldo) + ")";
            $select.append('<option value="' + acc.id + '">' + optionText + "</option>");
        }
    }
}

// ----------------------------------------
// PÁGINA: TRANSFERIR
// ----------------------------------------

function initTransfer() {
    if (!requireAuth()) {
        return;
    }
    
    processExpiredTransfers();
    
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    loadAccountsForTransfer();
    loadDestinatarios();
    
    $("#mensaje").on("input", function() {
        $("#charCount").text($(this).val().length);
    });
    
    $("#cuentaOrigen").on("change", function() {
        var accountId = $(this).val();
        
        if (accountId) {
            var accounts = getAccounts();
            var account = null;
            
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id === accountId) {
                    account = accounts[i];
                    break;
                }
            }
            
            if (account) {
                $("#origenBanco").text(account.banco);
                $("#origenNumero").text(account.tipoCuenta + " - " + account.numeroCuenta);
                $("#origenSaldo").text(formatCurrency(account.saldo));
                $("#origenInfo").removeClass("d-none");
            }
        } else {
            $("#origenInfo").addClass("d-none");
        }
    });
    
    $("#destinatario").on("change", function() {
        var contactId = $(this).val();
        $("#destinatarioStatus").addClass("d-none");
        
        if (contactId) {
            var contacts = getContacts();
            var contact = null;
            
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].id === contactId) {
                    contact = contacts[i];
                    break;
                }
            }
            
            if (contact) {
                $("#infoBanco").text(contact.banco);
                $("#infoCuenta").text(contact.tipoCuenta + " - " + contact.numeroCuenta);
                $("#destinatarioInfo").removeClass("d-none");
                
                var existsInSystem = findAccountInSystem(contact.banco, contact.tipoCuenta, contact.numeroCuenta);
                
                if (existsInSystem) {
                    $("#destinatarioStatus").html('<span class="text-success">✓ Esta cuenta existe en el sistema. La transferencia será acreditada inmediatamente.</span>').removeClass("d-none");
                } else {
                    $("#destinatarioStatus").html('<span class="text-warning">⚠ Esta cuenta no existe en el sistema. La transferencia quedará EN PROCESO por 24 horas. Si no se acredita, será rechazada y los fondos serán devueltos.</span>').removeClass("d-none");
                }
            }
        } else {
            $("#destinatarioInfo").addClass("d-none");
        }
    });
    
    $("#transferForm").on("submit", function(e) {
        e.preventDefault();
        
        $("#transferError").addClass("d-none");
        
        var accountId = $("#cuentaOrigen").val();
        var destinatarioId = $("#destinatario").val();
        var monto = parseFloat($("#monto").val());
        var mensaje = $("#mensaje").val().trim();
        var emailComprobante = $("#emailComprobante").val().trim();
        
        if (!accountId) {
            $("#transferError").text("Error: Seleccione una cuenta de origen").removeClass("d-none");
            return;
        }
        
        if (!destinatarioId) {
            $("#transferError").text("Error: Seleccione un destinatario").removeClass("d-none");
            return;
        }
        
        if (!monto || monto <= 0) {
            $("#transferError").text("Error: Ingrese un monto válido mayor a 0").removeClass("d-none");
            return;
        }
        
        var accounts = getAccounts();
        var account = null;
        
        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].id === accountId) {
                account = accounts[i];
                break;
            }
        }
        
        if (!account) {
            $("#transferError").text("Error: Cuenta de origen no encontrada").removeClass("d-none");
            return;
        }
        
        if (monto > account.saldo) {
            $("#transferError").text("Error: Saldo insuficiente. Disponible: " + formatCurrency(account.saldo)).removeClass("d-none");
            return;
        }
        
        if (emailComprobante && !isValidEmail(emailComprobante)) {
            $("#transferError").text("Error: Email para comprobante inválido").removeClass("d-none");
            return;
        }
        
        var contacts = getContacts();
        var destinatario = null;
        
        for (var j = 0; j < contacts.length; j++) {
            if (contacts[j].id === destinatarioId) {
                destinatario = contacts[j];
                break;
            }
        }
        
        if (!destinatario) {
            $("#transferError").text("Error: Destinatario no encontrado").removeClass("d-none");
            return;
        }
        
        // Verificar que no sea la misma cuenta
        var origenKey = getAccountKey(account.banco, account.tipoCuenta, account.numeroCuenta);
        var destinoKey = getAccountKey(destinatario.banco, destinatario.tipoCuenta, destinatario.numeroCuenta);
        
        if (origenKey === destinoKey) {
            $("#transferError").text("Error: No puede transferir a la misma cuenta de origen").removeClass("d-none");
            return;
        }
        
        var transferId = generateTransferId();
        var currentUser = getCurrentUserEmail();
        
        // Descontar saldo
        account.saldo = account.saldo - monto;
        setAccounts(accounts);
        
        // Verificar si cuenta destino existe
        var destinoInSystem = findAccountInSystem(destinatario.banco, destinatario.tipoCuenta, destinatario.numeroCuenta);
        var estadoAcreditacion = "";
        
        if (destinoInSystem) {
            creditToAccount(destinoInSystem.userEmail, destinoInSystem.account.id, monto);
            estadoAcreditacion = ESTADO_ACREDITADA;
            
            var receivedKey = "user_" + destinoInSystem.userEmail + "_receivedTransfers";
            var receivedListJson = localStorage.getItem(receivedKey);
            var receivedList = [];
            if (receivedListJson) {
                receivedList = JSON.parse(receivedListJson);
            }
            
            var receivedTx = {
                transferId: transferId,
                fechaHora: new Date().toISOString(),
                remitente: {
                    nombre: getCurrentUserName(),
                    email: currentUser,
                    banco: account.banco
                },
                cuentaDestino: {
                    id: destinoInSystem.account.id,
                    alias: destinoInSystem.account.alias,
                    banco: destinoInSystem.account.banco
                },
                monto: monto,
                mensaje: mensaje,
                estado: ESTADO_ACREDITADA
            };
            
            receivedList.unshift(receivedTx);
            localStorage.setItem(receivedKey, JSON.stringify(receivedList));
        } else {
            estadoAcreditacion = ESTADO_EN_PROCESO;
            
            var pendingTx = {
                transferId: transferId,
                fechaHora: new Date().toISOString(),
                remitenteEmail: currentUser,
                remitenteNombre: getCurrentUserName(),
                cuentaOrigen: {
                    id: account.id,
                    alias: account.alias,
                    banco: account.banco,
                    tipoCuenta: account.tipoCuenta,
                    numeroCuenta: account.numeroCuenta
                },
                destinatario: {
                    rut: destinatario.rut,
                    nombre: destinatario.nombre,
                    banco: destinatario.banco,
                    tipoCuenta: destinatario.tipoCuenta,
                    numeroCuenta: destinatario.numeroCuenta
                },
                monto: monto,
                mensaje: mensaje
            };
            
            addPendingTransfer(pendingTx);
        }
        
        var transaction = {
            transferId: transferId,
            id: transferId,
            fechaHora: new Date().toISOString(),
            cuentaOrigen: {
                id: account.id,
                alias: account.alias,
                banco: account.banco,
                tipoCuenta: account.tipoCuenta,
                numeroCuenta: account.numeroCuenta
            },
            destinatario: {
                rut: destinatario.rut,
                nombre: destinatario.nombre,
                banco: destinatario.banco,
                tipoCuenta: destinatario.tipoCuenta,
                numeroCuenta: destinatario.numeroCuenta
            },
            monto: monto,
            mensaje: mensaje,
            emailComprobante: emailComprobante,
            estado: "SUCCESS",
            estadoAcreditacion: estadoAcreditacion
        };
        
        var transactions = getTransactions();
        transactions.unshift(transaction);
        setTransactions(transactions);
        
        setLastTransaction(transaction);
        
        $("#btnTransferir").html('<span class="spinner-border spinner-border-sm me-2"></span>Procesando...').prop("disabled", true);
        
        setTimeout(function() {
            window.location.href = "receipt.html";
        }, 1500);
    });
}

// Cargar cuentas para transferencia
function loadAccountsForTransfer() {
    var accounts = getAccounts();
    var $select = $("#cuentaOrigen");
    
    $select.find("option:not(:first)").remove();
    
    if (accounts.length === 0) {
        $("#noAccountsAlert").removeClass("d-none");
        $("#transferForm").find('button[type="submit"]').prop("disabled", true);
    } else {
        for (var i = 0; i < accounts.length; i++) {
            var acc = accounts[i];
            var optionText = acc.alias + " - " + acc.banco + " (" + formatCurrency(acc.saldo) + ")";
            $select.append('<option value="' + acc.id + '">' + optionText + "</option>");
        }
    }
}

// Cargar destinatarios
function loadDestinatarios() {
    var contacts = getContacts();
    var $select = $("#destinatario");
    
    $select.find("option:not(:first)").remove();
    
    if (contacts.length === 0) {
        $select.append('<option value="" disabled>No hay destinatarios - Agrega uno primero</option>');
    } else {
        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            var existsInSystem = findAccountInSystem(c.banco, c.tipoCuenta, c.numeroCuenta);
            var indicator = existsInSystem ? "✓" : "○";
            var optionText = indicator + " " + c.nombre + " - " + c.rut + " (" + c.banco + ")";
            $select.append('<option value="' + c.id + '">' + optionText + "</option>");
        }
    }
}

// ----------------------------------------
// PÁGINA: COMPROBANTE
// ----------------------------------------

function initReceipt() {
    if (!requireAuth()) {
        return;
    }
    
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    var tx = getLastTransaction();
    
    if (!tx) {
        window.location.href = "menu.html";
        return;
    }
    
    $("#receiptMonto").text(formatCurrency(tx.monto));
    $("#receiptCuentaOrigen").text(tx.cuentaOrigen.alias + " (" + tx.cuentaOrigen.banco + ")");
    $("#receiptNombre").text(tx.destinatario.nombre);
    $("#receiptRut").text(tx.destinatario.rut);
    $("#receiptBanco").text(tx.destinatario.banco);
    $("#receiptTipoCuenta").text(tx.destinatario.tipoCuenta);
    $("#receiptNumeroCuenta").text(tx.destinatario.numeroCuenta);
    $("#receiptFecha").text(formatDate(tx.fechaHora));
    $("#receiptReferencia").text(tx.transferId || tx.id);
    
    if (tx.mensaje) {
        $("#receiptMensaje").text(tx.mensaje);
        $("#receiptMensajeRow").removeClass("d-none");
    }
    
    if (tx.estadoAcreditacion === ESTADO_ACREDITADA) {
        var htmlAcreditada = '<div class="alert alert-success">';
        htmlAcreditada += "<strong>✓ Transferencia ACREDITADA</strong><br>";
        htmlAcreditada += "La cuenta de destino existe en el sistema y el monto ha sido acreditado inmediatamente.";
        htmlAcreditada += "</div>";
        $("#receiptStatus").html(htmlAcreditada);
    } else if (tx.estadoAcreditacion === ESTADO_EN_PROCESO) {
        var htmlProceso = '<div class="alert alert-warning">';
        htmlProceso += "<strong>⏳ Transferencia EN PROCESO</strong><br>";
        htmlProceso += "La cuenta de destino no existe actualmente en nuestro sistema. La transferencia quedará pendiente por <strong>24 horas</strong>.<br>";
        htmlProceso += '<ul class="mb-1 mt-2">';
        htmlProceso += "<li>Si el destinatario crea la cuenta dentro de 24h, los fondos serán acreditados automáticamente.</li>";
        htmlProceso += "<li>Si expiran las 24h sin acreditación, la transferencia será <strong>RECHAZADA</strong> y los fondos serán devueltos a tu cuenta.</li>";
        htmlProceso += "<li>Puedes cancelar esta transferencia desde el Historial y recuperar los fondos inmediatamente.</li>";
        htmlProceso += "</ul>";
        htmlProceso += '<small class="text-muted">(Nota: En la banca real esto no ocurre, pero aquí se realiza bajo el supuesto de que la cuenta existe fuera de nuestra base de datos local)</small>';
        htmlProceso += "</div>";
        $("#receiptStatus").html(htmlProceso);
    }
}

// ----------------------------------------
// PÁGINA: HISTORIAL
// ----------------------------------------

function initHistory() {
    if (!requireAuth()) {
        return;
    }
    
    var expiredCount = processExpiredTransfers();
    if (expiredCount > 0) {
        $("#expiredAlert").html("<strong>ℹ️</strong> Se procesaron " + expiredCount + " transferencia(s) expirada(s). Los fondos han sido devueltos.").removeClass("d-none");
    }
    
    $("#btnLogout").on("click", function(e) {
        e.preventDefault();
        logout();
    });
    
    var totalBalance = getTotalBalance();
    $("#totalBalance").text(formatCurrency(totalBalance));
    
    var transactions = getTransactions();
    var deposits = getDeposits();
    var received = getReceivedTransfers();
    
    var totalTransferred = 0;
    var totalDeposited = 0;
    var totalReceived = 0;
    
    for (var i = 0; i < transactions.length; i++) {
        var tx = transactions[i];
        if (tx.estadoAcreditacion === ESTADO_ACREDITADA || tx.estadoAcreditacion === ESTADO_EN_PROCESO) {
            totalTransferred = totalTransferred + tx.monto;
        }
    }
    
    for (var j = 0; j < deposits.length; j++) {
        totalDeposited = totalDeposited + deposits[j].monto;
    }
    
    for (var k = 0; k < received.length; k++) {
        totalReceived = totalReceived + received[k].monto;
    }
    
    // Combinar movimientos
    var allTx = [];
    
    for (var a = 0; a < transactions.length; a++) {
        var txCopy = JSON.parse(JSON.stringify(transactions[a]));
        txCopy.tipoMovimiento = "TRANSFERENCIA_ENVIADA";
        allTx.push(txCopy);
    }
    
    for (var b = 0; b < deposits.length; b++) {
        var depCopy = JSON.parse(JSON.stringify(deposits[b]));
        depCopy.tipoMovimiento = "DEPOSITO";
        allTx.push(depCopy);
    }
    
    for (var c = 0; c < received.length; c++) {
        var recCopy = JSON.parse(JSON.stringify(received[c]));
        recCopy.tipoMovimiento = "TRANSFERENCIA_RECIBIDA";
        allTx.push(recCopy);
    }
    
    // Ordenar
    allTx.sort(function(x, y) {
        return new Date(y.fechaHora) - new Date(x.fechaHora);
    });
    
    // Actualizar estadísticas
    $("#totalDeposited").text(formatCurrency(totalDeposited + totalReceived));
    $("#totalTransferred").text(formatCurrency(totalTransferred));
    $("#totalCount").text(allTx.length);
    $("#transactionCount").text(allTx.length + " movimientos");
    
    // Renderizar tabla
    var $tbody = $("#transactionsTable");
    $tbody.empty();
    
    if (allTx.length === 0) {
        $tbody.html('<tr><td colspan="7" class="text-center text-muted py-4">No hay movimientos registrados</td></tr>');
    } else {
        for (var m = 0; m < allTx.length; m++) {
            var mov = allTx[m];
            var cuenta = "";
            var descripcion = "";
            var montoClass = "";
            var montoPrefix = "";
            var badge = "";
            var acciones = "";
            var rowClass = "";
            
            if (mov.tipoMovimiento === "DEPOSITO") {
                if (mov.cuentaDestino && mov.cuentaDestino.alias) {
                    cuenta = mov.cuentaDestino.alias;
                } else {
                    cuenta = "N/A";
                }
                
                if (mov.origen && mov.origen.nombre) {
                    descripcion = "<strong>" + mov.origen.nombre + "</strong>";
                } else {
                    descripcion = "<strong>Depósito</strong>";
                }
                if (mov.origen && mov.origen.email) {
                    descripcion += '<br><small class="text-muted">' + mov.origen.email + "</small>";
                }
                
                montoClass = "text-success";
                montoPrefix = "+";
                badge = '<span class="badge bg-success">DEPÓSITO</span>';
                rowClass = "table-success";
            } else if (mov.tipoMovimiento === "TRANSFERENCIA_RECIBIDA") {
                if (mov.cuentaDestino && mov.cuentaDestino.alias) {
                    cuenta = mov.cuentaDestino.alias;
                } else {
                    cuenta = "N/A";
                }
                
                if (mov.remitente && mov.remitente.nombre) {
                    descripcion = "<strong>De: " + mov.remitente.nombre + "</strong>";
                } else {
                    descripcion = "<strong>De: N/A</strong>";
                }
                if (mov.remitente && mov.remitente.email) {
                    descripcion += '<br><small class="text-muted">' + mov.remitente.email + "</small>";
                }
                
                montoClass = "text-success";
                montoPrefix = "+";
                badge = '<span class="badge bg-info">RECIBIDA</span>';
                rowClass = "table-success";
            } else {
                if (mov.cuentaOrigen && mov.cuentaOrigen.alias) {
                    cuenta = mov.cuentaOrigen.alias;
                } else {
                    cuenta = "N/A";
                }
                
                descripcion = "<strong>" + mov.destinatario.nombre + "</strong>";
                descripcion += '<br><small class="text-muted">' + mov.destinatario.rut + "</small>";
                
                montoClass = "text-danger";
                montoPrefix = "-";
                badge = getBadgeForStatus(mov.estadoAcreditacion);
                
                if (mov.estadoAcreditacion === ESTADO_EN_PROCESO) {
                    var txId = mov.transferId || mov.id;
                    acciones = '<button class="btn btn-sm btn-outline-warning btn-cancel-transfer" data-id="' + txId + '">Cancelar</button>';
                }
                
                if (mov.estadoAcreditacion === ESTADO_RECHAZADA || mov.estadoAcreditacion === ESTADO_CANCELADA) {
                    montoClass = "text-muted";
                    descripcion += '<br><small class="text-success">💰 Fondos devueltos</small>';
                }
            }
            
            var html = '<tr class="' + rowClass + '">';
            html += "<td>" + formatDate(mov.fechaHora) + "</td>";
            html += "<td><small>" + cuenta + "</small></td>";
            html += "<td>" + descripcion + "</td>";
            html += '<td class="' + montoClass + ' fw-bold">' + montoPrefix + formatCurrency(mov.monto) + "</td>";
            html += "<td>" + badge + "</td>";
            html += '<td><code class="small">' + (mov.transferId || mov.id) + "</code></td>";
            html += "<td>" + acciones + "</td>";
            html += "</tr>";
            
            $tbody.append(html);
        }
        
        // Configurar botones cancelar
        $(".btn-cancel-transfer").off("click").on("click", function() {
            var transferId = $(this).data("id");
            
            if (!confirm("¿Cancelar esta transferencia? Los fondos serán devueltos a tu cuenta.")) {
                return;
            }
            
            var result = cancelTransfer(transferId);
            
            if (result.success) {
                alert(result.message);
                initHistory();
            } else {
                alert("Error: " + result.message);
            }
        });
    }
}

// ----------------------------------------
// INICIALIZACIÓN GLOBAL
// ----------------------------------------

$(document).ready(function() {
    console.log("Alke Wallet - Módulo 2: Fundamentos del Desarrollo Frontend");
    console.log("Estados de transferencia: ACREDITADA, EN_PROCESO, RECHAZADA, CANCELADA");
    console.log("TTL de transferencias pendientes: 24 horas");
});
