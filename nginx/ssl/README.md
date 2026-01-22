# Nginx SSL Directory
# Placez vos certificats SSL ici :
# - fullchain.pem (certificat + chaîne)
# - privkey.pem (clé privée)

# Pour générer des certificats auto-signés (développement) :
# openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#   -keyout privkey.pem -out fullchain.pem

# Pour production, utilisez Let's Encrypt :
# certbot certonly --webroot -w /var/www/certbot \
#   -d votre-domaine.ne --email admin@votre-domaine.ne

# NOTE: Ce dossier doit être monté comme volume dans docker-compose.yml
