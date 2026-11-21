#!/bin/bash
# =============================================================================
# Script à exécuter DANS la VM VirtualBox
# Prépare le disque pour le compactage en remplissant l'espace vide avec des zéros
# =============================================================================

set -e

echo "=== Préparation du VDI pour compactage ==="
echo ""

# Vérifier qu'on est bien dans une VM
if [ ! -d /sys/class/dmi/id ] || ! grep -qi "virtualbox\|vbox" /sys/class/dmi/id/product_name 2>/dev/null; then
    echo "⚠️  Attention: Ce script semble ne pas être exécuté dans VirtualBox"
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Afficher l'espace avant
echo "📊 Espace disque avant:"
df -h /
echo ""

# Étape 1: TRIM (si supporté)
echo "🔧 Étape 1/3: Exécution de fstrim..."
if sudo fstrim -av 2>/dev/null; then
    echo "✅ TRIM effectué"
else
    echo "⚠️  TRIM non supporté ou échoué (ce n'est pas grave)"
fi
echo ""

# Étape 2: Nettoyage système
echo "🧹 Étape 2/3: Nettoyage du système..."
sudo apt clean 2>/dev/null || true
sudo journalctl --vacuum-size=50M 2>/dev/null || true
rm -rf ~/.cache/* 2>/dev/null || true
echo "✅ Cache nettoyé"
echo ""

# Étape 3: Remplir avec des zéros
echo "📝 Étape 3/3: Remplissage de l'espace libre avec des zéros..."
echo "   (Cela peut prendre plusieurs minutes)"
echo ""

sudo dd if=/dev/zero of=/zerofill bs=1M status=progress 2>&1 || true
sudo rm -f /zerofill

echo ""
echo "✅ Préparation terminée!"
echo ""
echo "📊 Espace disque après:"
df -h /
echo ""
echo "=== PROCHAINES ÉTAPES ==="
echo "1. Éteindre la VM: sudo shutdown now"
echo "2. Sur l'hôte, exécuter le script: host-compact-vdi.sh"
echo ""

read -p "Éteindre la VM maintenant? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo shutdown now
fi
