/**
 * Service d'export Excel
 * Génère des fichiers .xlsx pour les rapports
 */

import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export class ExcelService {
  /**
   * Exporte des données vers un fichier Excel
   */
  static exportToExcel(
    data: any[],
    columns: ExportColumn[],
    fileName: string
  ): Buffer {
    // Préparer les données pour l'export
    const exportData = data.map((row) => {
      const exportRow: any = {};
      columns.forEach((col) => {
        exportRow[col.header] = row[col.key] || '';
      });
      return exportRow;
    });

    // Créer le workbook et worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');

    // Définir les largeurs de colonnes
    const colWidths = columns.map((col) => ({
      wch: col.width || 15,
    }));
    worksheet['!cols'] = colWidths;

    // Générer le buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return buffer as Buffer;
  }

  /**
   * Génère un nom de fichier avec la date
   */
  static generateFileName(prefix: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `${prefix}_${date}.xlsx`;
  }

  /**
   * Exporte un rapport de demandes
   */
  static exportDemandesReport(demandes: any[]): Buffer {
    const columns: ExportColumn[] = [
      { header: 'N° Enregistrement', key: 'numeroEnregistrement', width: 20 },
      { header: 'Nom', key: 'appelNom', width: 20 },
      { header: 'Prénom', key: 'appelPrenom', width: 20 },
      { header: 'Promotion', key: 'promotion', width: 15 },
      { header: 'Statut', key: 'statut', width: 20 },
      { header: 'Date enregistrement', key: 'dateEnregistrement', width: 20 },
      { header: 'Agent', key: 'agentNom', width: 25 },
      { header: 'Observations', key: 'observations', width: 40 },
    ];

    const data = demandes.map((d) => ({
      numeroEnregistrement: d.numeroEnregistrement,
      appelNom: d.appele?.nom || '',
      appelPrenom: d.appele?.prenom || '',
      promotion: d.appele?.promotion || '',
      statut: d.statut,
      dateEnregistrement: new Date(d.dateEnregistrement).toLocaleDateString('fr-FR'),
      agentNom: d.agent ? `${d.agent.prenom} ${d.agent.nom}` : '',
      observations: d.observations || '',
    }));

    return this.exportToExcel(data, columns, this.generateFileName('rapport_demandes'));
  }

  /**
   * Exporte un rapport d'attestations
   */
  static exportAttestationsReport(attestations: any[]): Buffer {
    const columns: ExportColumn[] = [
      { header: 'N° Attestation', key: 'numero', width: 20 },
      { header: 'Nom', key: 'appelNom', width: 20 },
      { header: 'Prénom', key: 'appelPrenom', width: 20 },
      { header: 'Date génération', key: 'dateGeneration', width: 20 },
      { header: 'Date signature', key: 'dateSignature', width: 20 },
      { header: 'Type signature', key: 'typeSignature', width: 20 },
      { header: 'Signataire', key: 'signataire', width: 25 },
      { header: 'Statut', key: 'statut', width: 15 },
    ];

    const data = attestations.map((a) => ({
      numero: a.numero,
      appelNom: a.demande?.appele?.nom || '',
      appelPrenom: a.demande?.appele?.prenom || '',
      dateGeneration: new Date(a.dateGeneration).toLocaleDateString('fr-FR'),
      dateSignature: a.dateSignature ? new Date(a.dateSignature).toLocaleDateString('fr-FR') : '',
      typeSignature: a.typeSignature || '',
      signataire: a.signataire ? `${a.signataire.prenom} ${a.signataire.nom}` : '',
      statut: a.statut,
    }));

    return this.exportToExcel(data, columns, this.generateFileName('rapport_attestations'));
  }

  /**
   * Exporte un rapport d'activité des agents
   */
  static exportAgentsReport(agents: any[]): Buffer {
    const columns: ExportColumn[] = [
      { header: 'Agent', key: 'nom', width: 30 },
      { header: 'Demandes traitées', key: 'demandesTraitees', width: 20 },
      { header: 'Validées', key: 'validees', width: 15 },
      { header: 'Rejetées', key: 'rejetees', width: 15 },
      { header: 'Taux validation', key: 'tauxValidation', width: 20 },
      { header: 'Temps moyen (jours)', key: 'tempsMoyen', width: 20 },
    ];

    const data = agents.map((a) => ({
      nom: `${a.prenom} ${a.nom}`,
      demandesTraitees: a.stats?.total || 0,
      validees: a.stats?.validees || 0,
      rejetees: a.stats?.rejetees || 0,
      tauxValidation: a.stats?.tauxValidation ? `${a.stats.tauxValidation}%` : '0%',
      tempsMoyen: a.stats?.tempsMoyen || 0,
    }));

    return this.exportToExcel(data, columns, this.generateFileName('rapport_agents'));
  }
}
