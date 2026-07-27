import "dotenv/config";
import { addDocument } from "../services/vectorStore.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Example curated documents for a "health" domain knowledge base.
 * Replace/extend this with real vetted sources (WHO, CDC, peer-reviewed
 * summaries, etc.) split into small chunks (a few sentences each) for
 * better retrieval precision.
 */
const documents = [
  {
    title: "WHO — Vaccines and Immunization Overview",
    url: "https://www.who.int/health-topics/vaccines-and-immunization",
    text: "Vaccines work by training the immune system to recognize and fight pathogens, such as viruses or bacteria, by introducing a weakened, inactivated, or partial form of the pathogen or its antigens. Immunization prevents an estimated 3.5-5 million deaths every year from diseases like diphtheria, tetanus, pertussis, influenza, and measles.",
  },
  {
    title: "CDC — Climate Change and Public Health",
    url: "https://www.cdc.gov/climateandhealth",
    text: "Rising global temperatures are associated with increased frequency of extreme heat events, which in turn are linked to higher rates of heat-related illness and mortality, particularly among elderly populations and outdoor workers.",
  },
  {
    title: "WHO — Antimicrobial Resistance",
    url: "https://www.who.int/health-topics/antimicrobial-resistance",
    text: "Antimicrobial resistance occurs when bacteria, viruses, fungi, and parasites change over time and no longer respond to medicines, making infections harder to treat and increasing the risk of disease spread, severe illness, and death. Overuse and misuse of antibiotics in humans and animals is a major driver of this resistance.",
  },
  {
    title: "CDC — Physical Activity Guidelines",
    url: "https://www.cdc.gov/physicalactivity/basics",
    text: "Adults are generally recommended to get at least 150 minutes of moderate-intensity aerobic activity per week, along with muscle-strengthening activities on two or more days a week, to reduce the risk of chronic diseases such as heart disease, type 2 diabetes, and certain cancers.",
  },
  {
    title: "NASA — Climate Change Evidence",
    url: "https://climate.nasa.gov/evidence",
    text: "Multiple independent lines of scientific evidence, including rising global average temperatures, shrinking ice sheets, sea level rise, and ocean acidification, show that Earth's climate system has been warming since the mid-20th century, primarily due to human-caused increases in greenhouse gases.",
  },
  {
    title: "WHO — Mental Health and Depression",
    url: "https://www.who.int/health-topics/depression",
    text: "Depression is one of the leading causes of disability worldwide, affecting an estimated 280 million people. It is characterized by persistent sadness and loss of interest in activities, and is treatable through a combination of psychotherapy, medication, and lifestyle interventions in most cases.",
  },
  {
    title: "CDC — Handwashing and Infection Prevention",
    url: "https://www.cdc.gov/handwashing",
    text: "Handwashing with soap and water for at least 20 seconds is one of the most effective ways to prevent the spread of infectious diseases, including respiratory illnesses and gastrointestinal infections, by removing germs picked up from surfaces and other people.",
  },
  {
    title: "NOAA — Ocean Acidification",
    url: "https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-acidification",
    text: "As the ocean absorbs excess carbon dioxide from the atmosphere, seawater becomes more acidic, a process known as ocean acidification, which can impair the ability of shellfish, corals, and some plankton species to build and maintain their calcium carbonate shells and skeletons.",
  },
  {
    title: "WHO — Tobacco and Health Risks",
    url: "https://www.who.int/health-topics/tobacco",
    text: "Tobacco use kills more than 8 million people globally each year, including approximately 1.2 million deaths from exposure to secondhand smoke among non-smokers. Quitting tobacco use at any age provides measurable health benefits and reduces long-term disease risk.",
  },
  {
    title: "NIH — Sleep and Health",
    url: "https://www.nhlbi.nih.gov/health/sleep",
    text: "Most adults need between 7 and 9 hours of sleep per night for optimal cognitive function, immune health, and emotional regulation. Chronic sleep deprivation is associated with increased risk of obesity, cardiovascular disease, and impaired decision-making.",
  },
  // Add more curated, vetted snippets relevant to your chosen domain here.
];

async function run() {
  console.log(`Seeding ${documents.length} documents into vector KB...`);
  for (const doc of documents) {
    const id = uuidv4();
    await addDocument({
      id,
      text: doc.text,
      metadata: { title: doc.title, url: doc.url },
    });
    console.log(`  ✓ added: ${doc.title}`);
  }
  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});