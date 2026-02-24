import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationReverseQueryDto } from './dto/location-reverse-query.dto';

export type AppLocationReverseResultDto = {
  city: string | null;
  district: string | null;
  nearby: string | null;
  formattedAddress: string | null;
  source: 'amap' | 'fallback';
};

type AmapRegeoResponse = {
  status?: string;
  info?: string;
  regeocode?: {
    formatted_address?: string;
    addressComponent?: {
      city?: string | string[];
      province?: string;
      district?: string;
      township?: string;
      neighborhood?: {
        name?: string;
      };
      building?: {
        name?: string;
      };
      streetNumber?: {
        street?: string;
        number?: string;
      };
    };
  };
};

type AmapAddressComponent = NonNullable<
  NonNullable<AmapRegeoResponse['regeocode']>['addressComponent']
>;

type AmapAroundResponse = {
  status?: string;
  info?: string;
  pois?: Array<{
    name?: string;
  }>;
};

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(private readonly configService: ConfigService) {}

  async reverse(
    query: LocationReverseQueryDto,
  ): Promise<AppLocationReverseResultDto> {
    const amapKey = this.configService
      .get<string>('AMAP_WEB_SERVICE_KEY')
      ?.trim();

    if (!amapKey) {
      return this.buildFallback();
    }

    const location = `${query.lng},${query.lat}`;

    try {
      const [regeo, around] = await Promise.all([
        this.fetchAmapRegeo(amapKey, location),
        this.fetchAmapAround(amapKey, location),
      ]);

      const addressComponent = regeo.regeocode?.addressComponent;
      const city = this.normalizeCityName(this.pickCity(addressComponent));
      const district = this.pickText(addressComponent?.district);
      const nearby = this.pickNearby(addressComponent, around.pois);
      const formattedAddress = this.pickText(
        regeo.regeocode?.formatted_address,
      );

      return {
        city,
        district,
        nearby,
        formattedAddress,
        source: 'amap',
      };
    } catch (error) {
      this.logger.warn(`reverse lookup failed: ${(error as Error).message}`);
      return this.buildFallback();
    }
  }

  private async fetchAmapRegeo(
    key: string,
    location: string,
  ): Promise<AmapRegeoResponse> {
    const url = new URL('https://restapi.amap.com/v3/geocode/regeo');
    url.searchParams.set('key', key);
    url.searchParams.set('location', location);
    url.searchParams.set('extensions', 'base');
    url.searchParams.set('batch', 'false');
    url.searchParams.set('roadlevel', '0');
    return this.fetchAmapJson<AmapRegeoResponse>(url.toString());
  }

  private async fetchAmapAround(
    key: string,
    location: string,
  ): Promise<AmapAroundResponse> {
    const url = new URL('https://restapi.amap.com/v3/place/around');
    url.searchParams.set('key', key);
    url.searchParams.set('location', location);
    url.searchParams.set('radius', '1200');
    url.searchParams.set('offset', '5');
    url.searchParams.set('page', '1');
    url.searchParams.set('extensions', 'base');
    url.searchParams.set('sortrule', 'distance');
    return this.fetchAmapJson<AmapAroundResponse>(url.toString());
  }

  private async fetchAmapJson<T extends { status?: string; info?: string }>(
    url: string,
  ): Promise<T> {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) {
      throw new Error(`AMap HTTP ${response.status}`);
    }

    const payload = (await response.json()) as T;
    if (payload.status !== '1') {
      throw new Error(payload.info || 'AMap response error');
    }
    return payload;
  }

  private buildFallback(): AppLocationReverseResultDto {
    return {
      city: null,
      district: null,
      nearby: null,
      formattedAddress: null,
      source: 'fallback',
    };
  }

  private pickCity(component?: AmapAddressComponent): string | null {
    if (!component) {
      return null;
    }

    if (Array.isArray(component.city)) {
      return this.pickText(component.city[0]);
    }

    return (
      this.pickText(component.city) ?? this.pickText(component.province) ?? null
    );
  }

  private pickNearby(
    component: AmapAddressComponent | undefined,
    pois: AmapAroundResponse['pois'] | undefined,
  ): string | null {
    const poiName = this.pickText(pois?.[0]?.name);
    if (poiName) {
      return poiName;
    }

    const neighborhood = this.pickText(component?.neighborhood?.name);
    if (neighborhood) {
      return neighborhood;
    }

    const building = this.pickText(component?.building?.name);
    if (building) {
      return building;
    }

    const road = [
      this.pickText(component?.township),
      this.pickText(component?.streetNumber?.street),
      this.pickText(component?.streetNumber?.number),
    ]
      .filter(Boolean)
      .join('');

    return road.length > 0 ? road : null;
  }

  private pickText(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeCityName(value: string | null): string | null {
    const text = this.pickText(value);
    if (!text) {
      return null;
    }

    return text.replace(/(特别行政区|自治州|地区|盟|市)$/u, '').trim() || text;
  }
}
