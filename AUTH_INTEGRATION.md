# DRK Launcher - Integración de Autenticación

## Configuración del Servidor de Autenticación

Para integrar tu launcher con el servidor de autenticación DRK, debes configurar los siguientes endpoints:

### Endpoints Principales

#### 1. Autenticación (Yggdrasil Protocol)
- **URL**: `http://localhost:3000/authserver/authenticate`
- **Método**: `POST`
- **Descripción**: Autentica al usuario y devuelve tokens de acceso

**Ejemplo de solicitud:**
```json
{
  "agent": {
    "name": "Minecraft",
    "version": 1
  },
  "username": "tu_usuario",
  "password": "tu_contraseña",
  "clientToken": "token_cliente_opcional",
  "requestUser": true
}
```

**Ejemplo de respuesta:**
```json
{
  "accessToken": "token_acceso",
  "clientToken": "token_cliente",
  "selectedProfile": {
    "id": "uuid_usuario",
    "name": "nombre_usuario"
  },
  "availableProfiles": [
    {
      "id": "uuid_usuario",
      "name": "nombre_usuario"
    }
  ],
  "user": {
    "id": "uuid_usuario",
    "properties": []
  }
}
```

#### 2. Refresco de Token
- **URL**: `http://localhost:3000/authserver/refresh`
- **Método**: `POST`
- **Descripción**: Refresca un token de acceso existente

#### 3. Validación de Token
- **URL**: `http://localhost:3000/authserver/validate`
- **Método**: `POST`
- **Descripción**: Valida si un token de acceso es válido

#### 4. Invalidación de Token
- **URL**: `http://localhost:3000/authserver/invalidate`
- **Método**: `POST`
- **Descripción**: Invalida un token de acceso

#### 5. Cierre de Sesión
- **URL**: `http://localhost:3000/authserver/signout`
- **Método**: `POST`
- **Descripción**: Cierra la sesión del usuario

### Endpoints de Perfil (Yggdrasil Protocol)

#### 1. Obtener Perfil por UUID
- **URL**: `http://localhost:3000/sessionserver/session/minecraft/profile/{uuid}`
- **Método**: `GET`
- **Descripción**: Obtiene la información del perfil del jugador

#### 2. Unirse al Servidor
- **URL**: `http://localhost:3000/sessionserver/session/minecraft/join`
- **Método**: `POST`
- **Descripción**: Registra que un jugador se ha unido a un servidor

#### 3. Verificar Unión
- **URL**: `http://localhost:3000/sessionserver/session/minecraft/hasJoined`
- **Método**: `GET`
- **Descripción**: Verifica si un jugador se ha unido a un servidor

### Endpoints Personalizados de DRK

#### 1. Obtener Perfil de Usuario
- **URL**: `http://localhost:3000/api/user/profile`
- **Método**: `GET`
- **Encabezado**: `Authorization: Bearer {accessToken}`
- **Descripción**: Obtiene información completa del usuario incluyendo skins y capas

#### 2. Obtener Perfil por UUID
- **URL**: `http://localhost:3000/api/user/profile/{uuid}`
- **Método**: `GET`
- **Descripción**: Obtiene información del usuario por UUID

#### 3. Actualizar Skin Activa
- **URL**: `http://localhost:3000/api/user/skin/active`
- **Método**: `PUT`
- **Encabezado**: `Authorization: Bearer {accessToken}`
- **Cuerpo**: `{"skinUrl": "url_de_la_skin"}`

#### 4. Actualizar Capa Activa
- **URL**: `http://localhost:3000/api/user/cape/active`
- **Método**: `PUT`
- **Encabezado**: `Authorization: Bearer {accessToken}`
- **Cuerpo**: `{"capeUrl": "url_de_la_capa"}`

#### 5. Obtener Skins del Usuario
- **URL**: `http://localhost:3000/api/user/skins`
- **Método**: `GET`
- **Encabezado**: `Authorization: Bearer {accessToken}`

#### 6. Subir Skin
- **URL**: `http://localhost:3000/api/user/skins`
- **Método**: `POST`
- **Encabezado**: `Authorization: Bearer {accessToken}`
- **Cuerpo**: `{"name": "nombre_skin", "url": "url_de_la_skin"}`

#### 7. Eliminar Skin
- **URL**: `http://localhost:3000/api/user/skins/{skinId}`
- **Método**: `DELETE`
- **Encabezado**: `Authorization: Bearer {accessToken}`

#### 8. Obtener Capas del Usuario
- **URL**: `http://localhost:3000/api/user/capes`
- **Método**: `GET`
- **Encabezado**: `Authorization: Bearer {accessToken}`

#### 9. Subir Capa
- **URL**: `http://localhost:3000/api/user/capes`
- **Método**: `POST`
- **Encabezado**: `Authorization: Bearer {accessToken}`
- **Cuerpo**: `{"name": "nombre_capa", "url": "url_de_la_capa"}`

#### 10. Eliminar Capa
- **URL**: `http://localhost:3000/api/user/capes/{capeId}`
- **Método**: `DELETE`
- **Encabezado**: `Authorization: Bearer {accessToken}`

## Configuración en el Launcher

Para configurar tu launcher para que use este servidor de autenticación, debes:

1. Establecer el servidor de autenticación como `http://localhost:3000`
2. Asegurarte de que los endpoints coincidan con el protocolo Yggdrasil
3. Implementar la lógica para manejar skins y capas personalizadas

## Formato de Skins y Capas

- **Skins**: Archivos PNG con dimensiones 64x32, 64x64, 128x64 o 128x128 píxeles
- **Capas**: Archivos PNG con proporción 2:1 (por ejemplo, 64x32, 128x64)

## Seguridad

- Todos los endpoints que requieren autenticación usan tokens Bearer
- Los tokens expiran después de 24 horas
- Se recomienda usar HTTPS en producción