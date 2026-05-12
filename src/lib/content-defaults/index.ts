/**
 * Default section content for the visual editor.
 * When a section has never been saved to the DB, these values are used
 * so the editor shows meaningful pre-populated content instead of empty fields.
 */

import { blogDefaults } from './blog'
import { homeDefaults } from './home'
import { whyUsDefaults } from './why-us'
import { hyroxDefaults } from './hyrox'
import { trainingDefaults } from './training'
import { resultsDefaults } from './results'
import { kidsTeensDefaults } from './kids-teens'
import { membershipDefaults } from './membership'
import { startHereDefaults } from './start-here'
import { teamDefaults } from './team'
import { ourFacilitiesDefaults } from './our-facilities'
import { contactDefaults } from './contact'
import { physioDefaults } from './physio'
import { personalTrainingDefaults } from './personal-training'
import { kidsClassesWhitehavenDefaults } from './kids-classes-whitehaven'

export const PAGE_SECTION_DEFAULTS: Record<string, Record<string, Record<string, unknown>>> = {
  blog: blogDefaults,
  home: homeDefaults,
  'why-us': whyUsDefaults,
  hyrox: hyroxDefaults,
  training: trainingDefaults,
  results: resultsDefaults,
  'kids-teens': kidsTeensDefaults,
  membership: membershipDefaults,
  'start-here': startHereDefaults,
  team: teamDefaults,
  'our-facilities': ourFacilitiesDefaults,
  contact: contactDefaults,
  physio: physioDefaults,
  'personal-training': personalTrainingDefaults,
  'kids-classes/whitehaven': kidsClassesWhitehavenDefaults,
}
