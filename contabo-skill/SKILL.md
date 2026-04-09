---
description: Deploy and manage projects on Contabo VPS 212.28.182.235
tags: [contabo, deployment, infrastructure]
---

# Contabo Skill

Manage deployments on Contabo VPS (212.28.182.235).

## Connection

```
Host: 212.28.182.235
User: almaz
SSH key: /home/pets/.ssh/docutranslate_ru_proxy
```

### SSH command

```bash
ssh -i /home/pets/.ssh/docutranslate_ru_proxy almaz@212.28.182.235
```

### SCP command

```bash
scp -i /home/pets/.ssh/docutranslate_ru_proxy <file> almaz@212.28.182.235:<path>
```

## Server Facts

| Fact | Value |
|------|-------|
| OS | Ubuntu 20.04 |
| User | almaz (no passwordless sudo) |
| Docker | 26.1.3 |
| Docker Compose | v2.23.3 |
| Disk | 391G total, ~15G free |
| Port 80 | Occupied (caddy-server container) |
| Port 443 | Occupied (docutranslate-ru-proxy) |
| zip/unzip | Available |

## Running Containers

| Container | Ports |
|-----------|-------|
| docutranslate-ru-proxy | 443:443 |
| caddy-server | 8080:8080 |
| cbc_telegram_bot_stable | 8000:8000 |
| phoenix-translation | 8002:8080 |
| epub-bot | (none) |
| stt_service_pet-* | 8018, 5451, 6398, 9028, 9029 |

## Constraints

- **No passwordless sudo** — sudo commands require user action
- **Port 80 occupied** — can't use certbot HTTP-01 without stopping caddy
- **Port 443 occupied** — by our proxy container
- **Docker works** — almaz is in docker group
- **97% disk used** — watch disk space!

## Project Paths

| Project | Local Path | Contabo Path |
|---------|-----------|--------------|
| DocuTranslate | ~/zoo/docutranslate | ~/docutranslate_contabo |

## Deployment Workflow

### 1. Pack project locally

```bash
cd /home/pets/zoo/docutranslate
zip -r /tmp/docutranslate.zip . -x ".git/*" "node_modules/*" ".venv/*" "__pycache__/*" "*.pyc"
```

### 2. Transfer to Contabo

```bash
scp -i /home/pets/.ssh/docutranslate_ru_proxy /tmp/docutranslate.zip almaz@212.28.182.235:/tmp/
```

### 3. Unpack on Contabo

```bash
ssh -i /home/pets/.ssh/docutranslate_ru_proxy almaz@212.28.182.235 '
  mkdir -p ~/docutranslate_contabo
  cd ~/docutranslate_contabo
  unzip -o /tmp/docutranslate.zip
'
```

### 4. Start services

```bash
ssh ... almaz@212.28.182.235 'cd ~/docutranslate_contabo && docker compose up -d'
```

### 5. Health check

```bash
curl -k https://212.28.182.235/health
```

## Diagnostics

```bash
# Container status
ssh ... almaz@212.28.182.235 'docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# Container logs
ssh ... almaz@212.28.182.235 'docker logs docutranslate-ru-proxy --tail 50'

# Disk space
ssh ... almaz@212.28.182.235 'df -h /home'

# Port listeners
ssh ... almaz@212.28.182.235 'ss -tlnp | grep -E ":(80|443|8010|2053) "'

# Test from local
curl -k --resolve docutranslate.ru:443:212.28.182.235 https://docutranslate.ru/health
```

## Rollback

```bash
# Stop container
ssh ... almaz@212.28.182.235 'docker stop docutranslate-ru-proxy'

# Restore previous version
ssh ... almaz@212.28.182.235 'cd ~/docutranslate_contabo && docker compose down'
```
