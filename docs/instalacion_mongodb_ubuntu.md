# Instalación de MongoDB 7.0 en Ubuntu Server 22.04

```bash
sudo apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl status mongod     # debe decir: active (running)
mongosh --eval "db.version()"
```

## Si `mongod` no arranca en VirtualBox

MongoDB 5.0 o superior necesita que el procesador tenga instrucciones **AVX**. Algunas máquinas virtuales de VirtualBox no las exponen y el servicio falla con `Illegal instruction` o `status=4/ILL`.

Opciones:

1. En Windows (PowerShell como administrador) desactivar Hyper-V y apagar la VM: `bcdedit /set hypervisorlaunchtype off`, reiniciar el equipo y volver a probar.
2. Usar **MongoDB Atlas** (clúster gratuito M0) y conectarse desde la VM: `mongosh "mongodb+srv://<cluster>.mongodb.net/" --username <usuario>`. Los scripts funcionan igual, agregando la cadena de conexión antes del nombre del archivo.
