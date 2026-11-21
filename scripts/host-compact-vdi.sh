#!/bin/bash
# =============================================================================
# Script à exécuter sur l'HÔTE (pas dans la VM!)
# Compacte le fichier VDI après préparation dans la VM
# =============================================================================

set -e

echo "=== Compactage du VDI VirtualBox ==="
echo ""

# Vérifier que VBoxManage existe
if ! command -v VBoxManage &> /dev/null; then
    echo "❌ Erreur: VBoxManage non trouvé"
    echo "   Assurez-vous que VirtualBox est installé"
    exit 1
fi

# Lister les VMs
echo "📋 VMs disponibles:"
VBoxManage list vms
echo ""

# Lister les disques
echo "💾 Disques VDI disponibles:"
VBoxManage list hdds | grep -E "^UUID:|^Location:|^Capacity:|^Size on disk:" | paste - - - - 
echo ""

# Demander le chemin du VDI
echo "Entrez le chemin complet du fichier VDI à compacter"
echo "(ou copiez-le depuis la liste ci-dessus)"
read -p "Chemin: " VDI_PATH

# Vérifier que le fichier existe
if [ ! -f "$VDI_PATH" ]; then
    echo "❌ Erreur: Fichier non trouvé: $VDI_PATH"
    exit 1
fi

# Afficher la taille avant
echo ""
echo "📊 Taille avant compactage:"
ls -lh "$VDI_PATH"
BEFORE_SIZE=$(stat -c%s "$VDI_PATH")

# Vérifier que la VM est éteinte
echo ""
echo "⚠️  Assurez-vous que la VM utilisant ce VDI est ÉTEINTE!"
read -p "La VM est-elle éteinte? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé. Éteignez la VM d'abord."
    exit 1
fi

# Compacter
echo ""
echo "🔧 Compactage en cours... (peut prendre plusieurs minutes)"
VBoxManage modifymedium disk "$VDI_PATH" --compact

# Afficher la taille après
echo ""
echo "📊 Taille après compactage:"
ls -lh "$VDI_PATH"
AFTER_SIZE=$(stat -c%s "$VDI_PATH")

# Calculer la différence
SAVED=$((BEFORE_SIZE - AFTER_SIZE))
SAVED_MB=$((SAVED / 1024 / 1024))
SAVED_GB=$(echo "scale=2; $SAVED / 1024 / 1024 / 1024" | bc)

echo ""
echo "✅ Compactage terminé!"
echo "   Espace libéré: ${SAVED_MB} MB (~${SAVED_GB} GB)"
echo ""
echo "Vous pouvez maintenant redémarrer votre VM."
