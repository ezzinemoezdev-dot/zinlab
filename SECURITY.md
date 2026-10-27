# Sécurité — avant usage réel

- Les tables utilisent RLS, mais les politiques de plusieurs tables académiques sont volontairement permissives pour le prototype. Avant production, remplacez-les par des règles d'accès par lycée/classe/enseignant.
- Ne stockez pas de mots de passe vous-mêmes : utilisez Supabase Auth.
- Ne publiez jamais la clé `service_role` / `secret`.
- Activez la confirmation d'e-mail, configurez les URL de redirection Auth et limitez les inscriptions publiques.
- Faites des sauvegardes et testez la restauration.
- Respectez les règles applicables en Tunisie pour les données personnelles des élèves.
