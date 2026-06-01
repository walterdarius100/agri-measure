import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import InfoCard from "../components/InfoCard";
import PrimaryButton from "../components/PrimaryButton";
import colors from "../constants/colors";
import { saveMeasurement } from "../utils/storage";
import { analyzeMeasurementQuality } from "../utils/qualityUtils";
import { calculateSegmentDistances } from "../utils/geoUtils";
import screenStyles from "./screenStyles";

const PRECISION_WARNING =
  "Mesure indicative réalisée avec GPS mobile. Elle dépend de la précision du signal et ne remplace pas une mesure topographique ou cadastrale officielle.";

function formatText(value) {
  return value ? String(value) : "Non renseigné";
}

function formatNumber(value, fractionDigits = 2) {
  if (!Number.isFinite(value)) {
    return "Indisponible";
  }

  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

function formatMeters(value) {
  return Number.isFinite(value) ? `${formatNumber(value)} m` : "Indisponible";
}

function formatDate(value) {
  if (!value) {
    return "Indisponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Indisponible";
  }

  return date.toLocaleString("fr-FR");
}

function formatCoordinate(value) {
  return Number.isFinite(value) ? value.toFixed(7) : "Indisponible";
}

function formatPointTimestamp(value) {
  if (typeof value === "number" || typeof value === "string") {
    return formatDate(value);
  }

  return "Indisponible";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getQualityColor(qualityLevel) {
  if (qualityLevel === "good") {
    return colors.primary;
  }

  if (qualityLevel === "acceptable") {
    return colors.warning;
  }

  if (qualityLevel === "weak") {
    return colors.danger;
  }

  return colors.muted;
}

function normalizeSketchPoints(
  points,
  width = 500,
  height = 350,
  padding = 34,
) {
  const validPoints = points
    .map((point, index) => ({
      index,
      latitude: Number(point?.latitude),
      longitude: Number(point?.longitude),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
    );

  if (!validPoints.length) {
    return [];
  }

  const latitudes = validPoints.map((point) => point.latitude);
  const longitudes = validPoints.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude;
  const longitudeRange = maxLongitude - minLongitude;
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;
  const longitudeScale =
    longitudeRange > 0 ? drawableWidth / longitudeRange : Infinity;
  const latitudeScale =
    latitudeRange > 0 ? drawableHeight / latitudeRange : Infinity;
  const scale = Math.min(longitudeScale, latitudeScale);
  const safeScale = Number.isFinite(scale) ? scale : 1;
  const sketchWidth = longitudeRange * safeScale;
  const sketchHeight = latitudeRange * safeScale;
  const offsetX = padding + (drawableWidth - sketchWidth) / 2;
  const offsetY = padding + (drawableHeight - sketchHeight) / 2;

  return validPoints.map((point) => ({
    label: `P${point.index + 1}`,
    x:
      longitudeRange > 0
        ? offsetX + (point.longitude - minLongitude) * safeScale
        : width / 2,
    y:
      latitudeRange > 0
        ? offsetY + (maxLatitude - point.latitude) * safeScale
        : height / 2,
  }));
}

function buildTerrainSketchHtml(points) {
  const width = 500;
  const height = 350;
  const sketchPoints = normalizeSketchPoints(points, width, height);

  if (!sketchPoints.length) {
    return "";
  }

  const coordinatePairs = sketchPoints
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const isClosedPolygon = sketchPoints.length >= 3;
  const shape = isClosedPolygon
    ? `<polygon points="${coordinatePairs}" fill="#dff3e7" stroke="#2f855a" stroke-width="3" stroke-linejoin="round" />`
    : `<polyline points="${coordinatePairs}" fill="none" stroke="#2f855a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`;
  const pointMarkers = sketchPoints
    .map(
      (point) => `
        <g>
          <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="5.5" fill="#2f855a" />
          <text x="${(point.x + 9).toFixed(2)}" y="${(point.y - 9).toFixed(2)}" fill="#123524" font-size="13" font-family="Arial, Helvetica, sans-serif" font-weight="700">${escapeHtml(point.label)}</text>
        </g>
      `,
    )
    .join("");
  const statusText = isClosedPolygon
    ? ""
    : '<p class="sketch-status">Polygone non fermé</p>';

  return `
    <section class="section">
      <h2>4. Croquis du terrain</h2>
      <div class="content">
        <div class="sketch-frame">
          <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Croquis indicatif du terrain">
            <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="12" fill="#fbfdfb" stroke="#d8e2dc" stroke-width="2" />
            ${shape}
            ${pointMarkers}
          </svg>
        </div>
        ${statusText}
        <p class="sketch-legend">Croquis indicatif généré à partir des points GPS enregistrés.</p>
      </div>
    </section>
  `;
}

function ResultRow({ label, value }) {
  return (
    <View style={styles.resultRow}>
      <Text style={screenStyles.summaryLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

function PointRow({ index, point }) {
  return (
    <View style={styles.pointRow}>
      <Text style={styles.pointTitle}>Point GPS {index + 1}</Text>
      <ResultRow label="Latitude" value={formatCoordinate(point?.latitude)} />
      <ResultRow label="Longitude" value={formatCoordinate(point?.longitude)} />
      <ResultRow label="Précision" value={formatMeters(point?.accuracy)} />
      <ResultRow
        label="Horodatage"
        value={formatPointTimestamp(point?.timestamp)}
      />
    </View>
  );
}

function SegmentDistanceRow({ segment }) {
  return (
    <View style={styles.segmentRow}>
      <Text style={styles.segmentText}>
        Point {segment.from} → Point {segment.to} :{" "}
        {formatMeters(segment.distanceM)}
      </Text>
    </View>
  );
}

function buildPdfHtml({
  generatedAt,
  measurementInfo,
  points,
  qualityReport,
  result,
  segmentDistances,
  shouldShowAccuracyWarning,
}) {
  const pointRows = points.length
    ? points
        .map(
          (point, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(formatCoordinate(point?.latitude))}</td>
              <td>${escapeHtml(formatCoordinate(point?.longitude))}</td>
              <td>${escapeHtml(formatMeters(point?.accuracy))}</td>
              <td>${escapeHtml(formatPointTimestamp(point?.timestamp))}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="5">Aucun point GPS disponible.</td></tr>';

  const terrainSketchSection = buildTerrainSketchHtml(points);
  const segmentRows = segmentDistances.length
    ? segmentDistances
        .map(
          (segment) => `
            <tr>
              <td>Point ${segment.from}</td>
              <td>Point ${segment.to}</td>
              <td>${escapeHtml(formatMeters(segment.distanceM))}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="3">Distances indisponibles.</td></tr>';

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page { margin: 28px; }
          body {
            color: #1f2933;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.45;
          }
          .header {
            border-bottom: 3px solid #2f855a;
            margin-bottom: 18px;
            padding-bottom: 14px;
          }
          .brand {
            color: #2f855a;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          h1 {
            color: #123524;
            font-size: 24px;
            margin: 6px 0 4px;
          }
          .generated {
            color: #657786;
            margin: 0;
          }
          .section {
            border: 1px solid #d8e2dc;
            border-radius: 10px;
            margin-bottom: 14px;
            overflow: hidden;
          }
          .section h2 {
            background: #edf7f0;
            color: #123524;
            font-size: 15px;
            margin: 0;
            padding: 9px 12px;
          }
          .content { padding: 10px 12px; }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 14px;
          }
          .item-label {
            color: #657786;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
          .item-value {
            color: #1f2933;
            font-size: 13px;
            font-weight: 700;
            margin-top: 2px;
            white-space: pre-wrap;
          }
          .quality-badge {
            border-radius: 8px;
            color: #ffffff;
            display: inline-block;
            font-size: 13px;
            font-weight: 800;
            margin-bottom: 8px;
            padding: 7px 10px;
          }
          .quality-message {
            color: #1f2933;
            font-size: 13px;
            font-weight: 700;
            margin: 0 0 8px;
          }
          .sketch-frame {
            text-align: center;
            width: 100%;
          }
          .sketch-frame svg {
            max-width: 100%;
          }
          .sketch-legend {
            color: #657786;
            font-size: 11px;
            font-style: italic;
            margin: 8px 0 0;
            text-align: center;
          }
          .sketch-status {
            color: #8a4b00;
            font-size: 12px;
            font-weight: 800;
            margin: 8px 0 0;
            text-align: center;
          }
          .warning {
            background: #fff8e1;
            border: 1px solid #f2c94c;
            border-radius: 10px;
            color: #8a4b00;
            font-weight: 700;
            margin-bottom: 14px;
            padding: 11px 12px;
          }
          .legal {
            background: #f5f7f6;
            border: 1px solid #d8e2dc;
            border-radius: 10px;
            color: #123524;
            font-weight: 700;
            padding: 12px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border-bottom: 1px solid #d8e2dc;
            padding: 7px 6px;
            text-align: left;
            vertical-align: top;
          }
          th {
            background: #f5f7f6;
            color: #123524;
            font-size: 10px;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="brand">Agri-tech</div>
          <h1>FICHE DE MESURE DE TERRAIN</h1>
          <p class="generated">Date de génération du PDF : ${escapeHtml(formatDate(generatedAt))}</p>
        </header>

        <section class="section">
          <h2>1. Informations client</h2>
          <div class="content grid">
            <div><div class="item-label">Nom du client</div><div class="item-value">${escapeHtml(formatText(measurementInfo.clientName))}</div></div>
            <div><div class="item-label">Téléphone</div><div class="item-value">${escapeHtml(formatText(measurementInfo.phone))}</div></div>
            <div><div class="item-label">Localisation / zone</div><div class="item-value">${escapeHtml(formatText(measurementInfo.locationName))}</div></div>
          </div>
        </section>

        <section class="section">
          <h2>2. Informations du projet</h2>
          <div class="content grid">
            <div><div class="item-label">Type de projet agricole</div><div class="item-value">${escapeHtml(formatText(measurementInfo.projectType))}</div></div>
            <div><div class="item-label">Date de mesure</div><div class="item-value">${escapeHtml(formatDate(result.createdAt))}</div></div>
            <div><div class="item-label">Notes terrain</div><div class="item-value">${escapeHtml(formatText(measurementInfo.notes))}</div></div>
          </div>
        </section>

        <section class="section">
          <h2>3. Résultats de mesure</h2>
          <div class="content grid">
            <div><div class="item-label">Superficie en m²</div><div class="item-value">${escapeHtml(`${formatNumber(result.areaM2)} m²`)}</div></div>
            <div><div class="item-label">Superficie en hectares</div><div class="item-value">${escapeHtml(`${formatNumber(result.areaHa, 4)} ha`)}</div></div>
            <div><div class="item-label">Périmètre en mètres</div><div class="item-value">${escapeHtml(formatMeters(result.perimeterM))}</div></div>
            <div><div class="item-label">Nombre de points GPS</div><div class="item-value">${points.length}</div></div>
          </div>
        </section>

        ${terrainSketchSection}

        <section class="section">
          <h2>5. Distances des côtés du terrain</h2>
          <div class="content">
            <table>
              <thead>
                <tr><th>De</th><th>À</th><th>Distance</th></tr>
              </thead>
              <tbody>${segmentRows}</tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <h2>6. Rapport qualité GPS</h2>
          <div class="content grid">
            <div><div class="item-label">Précision moyenne GPS</div><div class="item-value">${escapeHtml(formatMeters(result.averageAccuracy))}</div></div>
            <div><div class="item-label">Meilleure précision GPS</div><div class="item-value">${escapeHtml(formatMeters(result.minAccuracy))}</div></div>
            <div><div class="item-label">Plus mauvaise précision GPS</div><div class="item-value">${escapeHtml(formatMeters(result.maxAccuracy))}</div></div>
          </div>
        </section>

        <section class="section">
          <h2>7. Rapport qualité terrain</h2>
          <div class="content">
            <div class="quality-badge" style="background: ${escapeHtml(getQualityColor(qualityReport.qualityLevel))};">Qualité générale : ${escapeHtml(qualityReport.qualityLabel)}</div>
            <p class="quality-message">${escapeHtml(qualityReport.qualityMessage)}</p>
            <p class="quality-message">Recommandation : ${escapeHtml(qualityReport.recommendation)}</p>
            <div class="grid">
              <div><div class="item-label">Nombre total de points GPS</div><div class="item-value">${qualityReport.totalPoints}</div></div>
              <div><div class="item-label">Points avec précision &gt; 10 m</div><div class="item-value">${qualityReport.weakPointsCount}</div></div>
              <div><div class="item-label">Points avec précision &gt; 15 m</div><div class="item-value">${qualityReport.veryWeakPointsCount}</div></div>
            </div>
          </div>
        </section>

        ${
          shouldShowAccuracyWarning
            ? '<div class="warning">Avertissement : la précision moyenne GPS est supérieure à 10 m. Interprétez cette mesure avec prudence.</div>'
            : ""
        }

        <section class="section">
          <h2>8. Points GPS</h2>
          <div class="content">
            <table>
              <thead>
                <tr><th>#</th><th>Latitude</th><th>Longitude</th><th>Précision</th><th>Horodatage</th></tr>
              </thead>
              <tbody>${pointRows}</tbody>
            </table>
          </div>
        </section>

        <section class="section">
          <h2>9. Avertissement</h2>
          <div class="content legal">${escapeHtml(PRECISION_WARNING)}</div>
        </section>
      </body>
    </html>
  `;
}

export default function ResultScreen({ navigation, route }) {
  const result = route.params ?? {};
  const isHistoryMode = result.readOnly === true || result.source === "history";
  const measurementInfo = result.measurementInfo ?? {};
  const points = useMemo(
    () => (Array.isArray(result.points) ? result.points : []),
    [result.points],
  );
  const pointsCount = points.length;
  const segmentDistances = useMemo(
    () => calculateSegmentDistances(points),
    [points],
  );
  const qualityReport = useMemo(
    () =>
      analyzeMeasurementQuality(
        points,
        result.averageAccuracy,
        result.maxAccuracy,
      ),
    [points, result.averageAccuracy, result.maxAccuracy],
  );
  const qualityColor = getQualityColor(qualityReport.qualityLevel);
  const shouldShowAccuracyWarning =
    Number.isFinite(result.averageAccuracy) && result.averageAccuracy > 10;
  const [hasSavedInSession, setHasSavedInSession] = useState(isHistoryMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setHasSavedInSession(isHistoryMode);
    setSuccessMessage("");
  }, [isHistoryMode, result.createdAt, result.id]);

  const handleSaveMeasurement = async () => {
    if (hasSavedInSession || isHistoryMode) {
      return;
    }

    setIsSaving(true);
    setSuccessMessage("");

    try {
      await saveMeasurement({
        id: result.id,
        createdAt: result.createdAt,
        measurementInfo,
        points,
        areaM2: result.areaM2,
        areaHa: result.areaHa,
        perimeterM: result.perimeterM,
        averageAccuracy: result.averageAccuracy,
        minAccuracy: result.minAccuracy,
        maxAccuracy: result.maxAccuracy,
      });
      setHasSavedInSession(true);
      setSuccessMessage("Mesure enregistrée avec succès.");
    } catch {
      Alert.alert(
        "Sauvegarde impossible",
        "La mesure n’a pas pu être enregistrée. Réessayez plus tard.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);

    try {
      const html = buildPdfHtml({
        generatedAt: new Date().toISOString(),
        measurementInfo,
        points,
        qualityReport,
        result,
        segmentDistances,
        shouldShowAccuracyWarning,
      });
      const { uri } = await Print.printToFileAsync({ html });
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (!isSharingAvailable) {
        Alert.alert(
          "Partage indisponible",
          "Le PDF a été généré, mais le partage n’est pas disponible sur cet appareil ou dans cet environnement.",
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: "Partager la fiche de mesure Agri-tech",
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });
    } catch {
      Alert.alert(
        "Export PDF impossible",
        "La fiche terrain PDF n’a pas pu être générée ou partagée. Réessayez plus tard.",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={screenStyles.content}
      style={screenStyles.container}
    >
      <View style={styles.headerCard}>
        <Text style={styles.brand}>Agri-tech</Text>
        <Text style={styles.mainTitle}>FICHE DE MESURE DE TERRAIN</Text>
        <Text style={styles.headerSubtitle}>
          Rapport terrain professionnel généré à partir des points GPS
          enregistrés.
        </Text>
      </View>

      {isHistoryMode ? (
        <View style={styles.readOnlyCard}>
          <Text style={styles.readOnlyText}>
            Mesure sauvegardée ouverte depuis l’historique.
          </Text>
        </View>
      ) : null}

      <InfoCard title="1. Informations client">
        <ResultRow
          label="Nom du client"
          value={formatText(measurementInfo.clientName)}
        />
        <ResultRow
          label="Téléphone"
          value={formatText(measurementInfo.phone)}
        />
        <ResultRow
          label="Localisation / zone"
          value={formatText(measurementInfo.locationName)}
        />
      </InfoCard>

      <InfoCard title="2. Informations du projet">
        <ResultRow
          label="Type de projet agricole"
          value={formatText(measurementInfo.projectType)}
        />
        <ResultRow
          label="Notes terrain"
          value={formatText(measurementInfo.notes)}
        />
        <ResultRow
          label="Date de mesure"
          value={formatDate(result.createdAt)}
        />
      </InfoCard>

      <InfoCard title="3. Résultats de mesure">
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Superficie</Text>
            <Text style={styles.metricValue}>
              {formatNumber(result.areaM2)}
            </Text>
            <Text style={styles.metricUnit}>m²</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Superficie</Text>
            <Text style={styles.metricValue}>
              {formatNumber(result.areaHa, 4)}
            </Text>
            <Text style={styles.metricUnit}>ha</Text>
          </View>
        </View>
        <ResultRow
          label="Périmètre en mètres"
          value={formatMeters(result.perimeterM)}
        />
        <ResultRow label="Nombre de points GPS" value={`${pointsCount}`} />
      </InfoCard>

      <InfoCard title="4. Rapport qualité GPS">
        <ResultRow
          label="Précision moyenne GPS"
          value={formatMeters(result.averageAccuracy)}
        />
        <ResultRow
          label="Meilleure précision GPS"
          value={formatMeters(result.minAccuracy)}
        />
        <ResultRow
          label="Plus mauvaise précision GPS"
          value={formatMeters(result.maxAccuracy)}
        />
        {shouldShowAccuracyWarning ? (
          <View style={styles.inlineWarningCard}>
            <Text style={styles.inlineWarningText}>
              Avertissement : la précision moyenne GPS est supérieure à 10 m.
              Interprétez cette mesure avec prudence.
            </Text>
          </View>
        ) : null}
      </InfoCard>

      <InfoCard title="5. Rapport qualité terrain">
        <View style={[styles.qualityHeader, { borderColor: qualityColor }]}>
          <Text style={[styles.qualityLabel, { color: qualityColor }]}>
            Qualité générale : {qualityReport.qualityLabel}
          </Text>
        </View>
        <ResultRow
          label="Message qualité"
          value={qualityReport.qualityMessage}
        />
        <ResultRow
          label="Recommandation"
          value={qualityReport.recommendation}
        />
        <ResultRow
          label="Nombre total de points GPS"
          value={`${qualityReport.totalPoints}`}
        />
        <ResultRow
          label="Nombre de points avec précision faible > 10 m"
          value={`${qualityReport.weakPointsCount}`}
        />
        <ResultRow
          label="Nombre de points avec précision très faible > 15 m"
          value={`${qualityReport.veryWeakPointsCount}`}
        />
      </InfoCard>

      {segmentDistances.length >= 1 ? (
        <InfoCard title="6. Distances des côtés">
          {segmentDistances.map((segment) => (
            <SegmentDistanceRow
              key={`segment-${segment.from}-${segment.to}`}
              segment={segment}
            />
          ))}
        </InfoCard>
      ) : null}

      <InfoCard
        title="7. Points GPS"
        description="Coordonnées collectées pendant la mesure terrain."
      >
        {points.length ? (
          points.map((point, index) => (
            <PointRow
              key={`${point?.timestamp ?? index}-${index}`}
              index={index}
              point={point}
            />
          ))
        ) : (
          <Text style={styles.emptyPointsText}>
            Aucun point GPS disponible.
          </Text>
        )}
      </InfoCard>

      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>8. Avertissement</Text>
        <Text style={styles.noticeText}>{PRECISION_WARNING}</Text>
      </View>

      {successMessage ? (
        <View style={styles.successCard}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <View style={screenStyles.buttonGroup}>
        <PrimaryButton
          disabled={isExportingPdf}
          label={isExportingPdf ? "Export PDF en cours…" : "Exporter en PDF"}
          onPress={handleExportPdf}
        />
        {!isHistoryMode ? (
          <PrimaryButton
            disabled={hasSavedInSession || isSaving}
            label={
              hasSavedInSession ? "Mesure enregistrée" : "Enregistrer la mesure"
            }
            onPress={handleSaveMeasurement}
            variant="secondary"
          />
        ) : null}
        <PrimaryButton
          label="Voir l’historique"
          onPress={() => navigation.navigate("History")}
          variant="secondary"
        />
        <PrimaryButton
          label="Nouvelle mesure"
          onPress={() => navigation.navigate("NewMeasurement")}
          variant="secondary"
        />
        <PrimaryButton
          label="Retour à l’accueil"
          onPress={() => navigation.navigate("Home")}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: 22,
    gap: 8,
    padding: 20,
  },
  brand: {
    color: "#BEE3C8",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  mainTitle: {
    color: colors.surface,
    fontSize: 27,
    fontWeight: "900",
    lineHeight: 34,
  },
  headerSubtitle: {
    color: "#E7F6EC",
    fontSize: 15,
    lineHeight: 22,
  },
  resultRow: {
    gap: 4,
    paddingVertical: 5,
  },
  resultValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    padding: 14,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: colors.primaryDark,
    fontSize: 23,
    fontWeight: "900",
    lineHeight: 30,
    marginTop: 6,
  },
  metricUnit: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  qualityHeader: {
    backgroundColor: colors.surfaceAlt,
    borderLeftWidth: 5,
    borderRadius: 14,
    marginBottom: 6,
    padding: 12,
  },
  qualityLabel: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },

  segmentRow: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  segmentText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  pointRow: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 2,
    padding: 14,
  },
  pointTitle: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyPointsText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  readOnlyCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  readOnlyText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  noticeCard: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  noticeTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  noticeText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  inlineWarningCard: {
    backgroundColor: "#FFF3CD",
    borderColor: colors.warning,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  inlineWarningText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: "#E7F6EC",
    borderColor: colors.primary,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  successText: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
});
