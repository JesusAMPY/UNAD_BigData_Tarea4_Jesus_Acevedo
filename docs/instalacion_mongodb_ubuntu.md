# Instalación de MongoDB en Ubuntu Server (desde PuTTY)

Copia y pega **una línea a la vez** en PuTTY (clic derecho pega). La contraseña que pide `sudo` es la de tu usuario.

## 1. Verificar la versión de Ubuntu

```bash
lsb_release -cs
```

Debe responder `jammy` (22.04) o `noble` (24.04). MongoDB 8.0 soporta ambas.

## 2. Instalar MongoDB 8.0

```bash
sudo rm -f /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get install -y gnupg curl git
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod --no-pager
mongosh --quiet --eval "db.version()"
```

`status` debe mostrar `active (running)` y el último comando la versión (8.0.x).

## 3. Ejecutar los scripts

```bash
cd ~
git clone https://github.com/JesusAMPY/UNAD_BigData_Tarea4_Jesus_Acevedo.git
cd UNAD_BigData_Tarea4_Jesus_Acevedo
mongosh --quiet scripts/01_crear_bd_e_insertar.js
mongosh --quiet scripts/02_consultas_crud.js
mongosh --quiet scripts/03_filtros_operadores_join.js
mongosh --quiet scripts/04_agregaciones.js
```

El script 02 modifica los datos, así que para repetirlo hay que correr antes el 01.

## Problemas comunes

- **`Unit mongod.service not found`**: el paquete no se instaló. Revisar el mensaje de `sudo apt-get install -y mongodb-org`; casi siempre es porque la línea del repositorio no corresponde a la versión de Ubuntu (por eso se usa `$(lsb_release -cs)`).
- **`Illegal instruction` o `status=4/ILL`**: MongoDB 5.0 o superior necesita instrucciones **AVX** del procesador. En Windows, ejecutar en PowerShell como administrador `bcdedit /set hypervisorlaunchtype off`, reiniciar y volver a probar. Otra opción es usar MongoDB Atlas (clúster gratuito M0) con `mongosh "mongodb+srv://<cluster>.mongodb.net/calidad_aire_aburra" --username <usuario> scripts/01_crear_bd_e_insertar.js`.
