# Instalación de MongoDB con Docker en Ubuntu (desde PuTTY)

MongoDB no publica paquetes `apt` para Ubuntu 26.04 (*resolute*), por eso se ejecuta en un contenedor Docker con la imagen oficial `mongo:8.0`, que ya incluye `mongosh`. Este método funciona igual en cualquier versión de Ubuntu.

Copia y pega **una línea a la vez** en PuTTY (clic derecho pega).

## 1. Esperar a que termine la actualización automática de Ubuntu

```bash
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do echo "Esperando a unattended-upgrades..."; sleep 10; done
```

## 2. Instalar Docker y Git

```bash
sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list
sudo apt-get update
sudo apt-get install -y docker.io git
sudo systemctl enable --now docker
```

## 3. Descargar el repositorio y levantar MongoDB

```bash
cd ~
git clone https://github.com/JesusAMPY/UNAD_BigData_Tarea4_Jesus_Acevedo.git
sudo docker run -d --name mongodb -p 27017:27017 -v ~/UNAD_BigData_Tarea4_Jesus_Acevedo:/tarea4 mongo:8.0
sudo docker ps
sudo docker exec mongodb mongosh --quiet --eval "db.version()"
```

`docker ps` debe mostrar el contenedor `mongodb` con estado `Up` y el último comando la versión (8.0.x).

## 4. Ejecutar los scripts

```bash
sudo docker exec mongodb mongosh --quiet /tarea4/scripts/01_crear_bd_e_insertar.js
sudo docker exec mongodb mongosh --quiet /tarea4/scripts/02_consultas_crud.js
sudo docker exec mongodb mongosh --quiet /tarea4/scripts/03_filtros_operadores_join.js
sudo docker exec mongodb mongosh --quiet /tarea4/scripts/04_agregaciones.js
```

El script 02 modifica los datos, así que para repetirlo hay que correr antes el 01.

Para abrir la consola interactiva de MongoDB: `sudo docker exec -it mongodb mongosh calidad_aire_aburra`

## Problemas comunes

- **`Could not get lock /var/lib/dpkg/lock-frontend`**: Ubuntu está instalando actualizaciones automáticas. Repetir el paso 1 y esperar.
- **El contenedor aparece como `Exited` en `sudo docker ps -a`**: revisar `sudo docker logs mongodb`. Si dice `Illegal instruction` o menciona **AVX**, el procesador virtual no expone esas instrucciones (MongoDB 5.0+ las necesita). Opciones:
  1. En Windows, PowerShell como administrador: `bcdedit /set hypervisorlaunchtype off`, reiniciar y volver a probar.
  2. Usar MongoDB 4.4, que no requiere AVX (usa el shell `mongo` en lugar de `mongosh`):
     ```bash
     sudo docker rm -f mongodb
     sudo docker run -d --name mongodb -p 27017:27017 -v ~/UNAD_BigData_Tarea4_Jesus_Acevedo:/tarea4 mongo:4.4
     sudo docker exec mongodb mongo --quiet /tarea4/scripts/01_crear_bd_e_insertar.js
     ```
