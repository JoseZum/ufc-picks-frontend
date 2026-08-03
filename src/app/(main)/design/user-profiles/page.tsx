import { UserProfileGallery } from '@/components/design-system-v2/gallery/UserProfileGallery';

export const metadata = {
  title: 'User profile options — UFC Picks',
};

/**
 * Local design gallery for the public profile at `/users/[userId]`.
 *
 * Four numbered takes on the same data so the choice is made by looking rather
 * than by describing. Everything renders from one fixed sample so the layouts
 * are compared on their merits and not on whose account happens to be seeded.
 * Nothing here is wired to the API and nothing links into the product.
 */
export default function UserProfilesDesignPage() {
  return <UserProfileGallery />;
}
