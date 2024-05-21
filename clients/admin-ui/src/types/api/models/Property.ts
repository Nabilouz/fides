/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { MinimalPrivacyExperienceConfig } from "./MinimalPrivacyExperienceConfig";
import type { PrivacyCenterConfig } from "./PrivacyCenterConfig";
import type { PropertyType } from "./PropertyType";

/**
 * A base template for all other Fides Schemas to inherit from.
 */
export type Property = {
  name: string;
  type: PropertyType;
  id?: string;
  experiences: Array<MinimalPrivacyExperienceConfig>;
  privacy_center_config?: PrivacyCenterConfig;
  stylesheet?: string;
  paths: Array<string>;
};
