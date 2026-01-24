/**
 * Service d'export Excel
 * Génère des fichiers .xlsx pour les rapports
 */

import ExcelJS from 'exceljs';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export class ExcelService {
  /**
   * Exporte des données vers un fichier Excel
   */
  static async exportToExcel(
    data: any[],
    columns: ExportColumn[],
    fileName: string
  ): Promise<Buffer> {
    // Créer le workbook et worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rapport');

    // Définir les colonnes avec headers et largeurs
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
    }));

    // Ajouter les données
    data.forEach((row) => {
      const exportRow: any = {};
      columns.forEach((col) => {
        exportRow[col.key] = row[col.key] || '';
      });
      worksheet.addRow(exportRow);
    });

    // Styliser l'en-tête
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Générer le buffer
    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
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
  static async exportDemandesReport(demandes: any[]): Promise<Buffer> {
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
  static async exportAttestationsReport(attestations: any[]): Promise<Buffer> {
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
  static async exportAgentsReport(agents: any[]): Promise<Buffer> {
    const columns: ExportColumn[] = [
      { header: 'Agent', key: 'nom', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Date inscription', key: 'dateInscription', width: 18 },
      { header: 'Demandes traitées', key: 'demandesTraitees', width: 20 },
      { header: 'Validées', key: 'validees', width: 15 },
      { header: 'Rejetées', key: 'rejetees', width: 15 },
      { header: 'Taux validation', key: 'tauxValidation', width: 20 },
      { header: 'Temps moyen (jours)', key: 'tempsMoyen', width: 20 },
    ];

    const data = agents.map((a) => ({
      nom: `${a.prenom} ${a.nom}`,
      email: a.email || '',
      dateInscription: a.createdAt ? new Date(a.createdAt).toLocaleDateString('fr-FR') : '',
      demandesTraitees: a.stats?.total || 0,
      validees: a.stats?.validees || 0,
      rejetees: a.stats?.rejetees || 0,
      tauxValidation: a.stats?.tauxValidation ? `${a.stats.tauxValidation}%` : '0%',
      tempsMoyen: a.stats?.tempsMoyen || 0,
    }));

    return this.exportToExcel(data, columns, this.generateFileName('rapport_agents'));
  }
}
