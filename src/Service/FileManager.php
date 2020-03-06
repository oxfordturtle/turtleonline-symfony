<?php

namespace App\Service;

use App\Entity\File;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;

class FileManager
{
  /**
   * Path the the uploads directory.
   *
   * @var string
   */
  private $uploadsDirectory;

  /**
   * Constructor function.
   *
   * @param ParameterBagInterface $params
   */
  public function __construct(ParameterBagInterface $params)
  {
    $this->uploadsDirectory = $params->get('uploads_directory');
  }

  /**
   * Get directories within a given path (relative to the user's home directory).
   *
   * @param User $user
   * @param string $path
   * @return array
   */
  private function getUserDirectoriesInPath(User $user, string $path): array
  {
    $rootDirectory = $this->uploadsDirectory.'user'.$user->getId();

    $directories = [];
    foreach (glob($rootDirectory.$path.'*') as $absolutePath) {
      if (is_dir($absolutePath)) {
        $relativePath = str_replace($rootDirectory, '', $absolutePath);
        $directories[] = [
          'path' => $relativePath,
          'directories' => $this->getUserDirectoriesInPath($user, $relativePath.'/'),
          'files' => $this->getUserFilesInPath($user, $relativePath.'/')
        ];
      }
    }
    return $directories;
  }

  /**
   * Get files within a given path (relative to the user's home directory).
   *
   * @param User $user
   * @param string $path
   * @return array
   */
  private function getUserFilesInPath(User $user, string $path): array
  {
    $rootDirectory = $this->uploadsDirectory.'user'.$user->getId();

    $files = [];
    foreach (glob($rootDirectory.$path.'*') as $absolutePath) {
      if (is_file($absolutePath)) {
        $relativePath = str_replace($rootDirectory, '', $absolutePath);
        $files[] = $relativePath;
      }
    }

    return $files;
  }

  /**
   * Get file data for the given user.
   *
   * @param User $user
   * @return array
   */
  public function getUserFileData(User $user): array
  {
    return [
      'path' => '/',
      'directories' => $this->getUserDirectoriesInPath($user, '/'),
      'files' => $this->getUserFilesInPath($user, '/')
    ];
  }
}
